'use server';

import { redirect } from 'next/navigation';
import db from '@/utils/db';
import { auth, currentUser } from '@clerk/nextjs/server';
import {
  imageSchema,
  productSchema,
  reviewSchema,
  validateWithZodSchema,
} from './schemas';
import { deleteImage, uploadImage } from './supabase';
import { revalidatePath } from 'next/cache';
import { dv } from '@faker-js/faker';
import { Cart } from '@prisma/client';

/* Errors */
export async function renderError(
  error: unknown
): Promise<{ message: string }> {
  console.log(error);

  return {
    message: error instanceof Error ? error.message : 'An error occurred',
  };
}

/* Users */
export async function getAuthUser() {
  const user = await currentUser();
  if (!user) {
    throw new Error('You must be logged in to access this route');
  }
  return user;
}

export async function getAdminUser() {
  const user = await getAuthUser();
  if (user.id !== process.env.ADMIN_USER_ID) {
    redirect('/');
  }
  return user;
}

/* Products */
export async function fetchFeaturedProducts() {
  const products = await db.product.findMany({
    where: {
      featured: true,
    },
  });
  return products;
}

export async function fetchAllProducts({ search = '' }: { search: string }) {
  return db.product.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ],
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function fetchSingleProduct(productId: string) {
  const product = await db.product.findUnique({
    where: {
      id: productId,
    },
  });

  if (!product) {
    redirect('/products');
  }
  return product;
}

export async function createProductAction(
  prevState: any,
  formData: FormData
): Promise<{ message: string }> {
  const user = await getAuthUser();

  try {
    const rawData = Object.fromEntries(formData);
    const file = formData.get('image') as File;
    const validatedFields = validateWithZodSchema(productSchema, rawData);
    const validatedFile = validateWithZodSchema(imageSchema, { image: file });
    const fullPath = await uploadImage(validatedFile.image);

    await db.product.create({
      data: {
        ...validatedFields,
        image: fullPath,
        clerkId: user.id,
      },
    });
  } catch (error) {
    return renderError(error);
  }
  redirect('/admin/products');
}

export async function updateProductImageAction(
  prevState: any,
  formData: FormData
) {
  await getAuthUser();

  try {
    const image = formData.get('image') as File;
    const productId = formData.get('id') as string;
    const oldImageUrl = formData.get('url') as string;

    const validatedFile = validateWithZodSchema(imageSchema, { image });
    const fullPath = await uploadImage(validatedFile.image);
    await deleteImage(oldImageUrl);
    await db.product.update({
      where: {
        id: productId,
      },
      data: {
        image: fullPath,
      },
    });

    revalidatePath(`/admin/products/${productId}/edit`);
    return { message: 'Product image updated successfully' };
  } catch (error) {
    return renderError(error);
  }
}

/* Admin */
export async function fetchAdminProducts() {
  await getAdminUser();
  const products = await db.product.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
  return products;
}

export async function deleteProductAction(prevState: { productId: string }) {
  const { productId } = prevState;
  await getAdminUser();

  try {
    const product = await db.product.delete({
      where: {
        id: productId,
      },
    });

    await deleteImage(product.image);
    revalidatePath('/admin/products');
    return { message: 'product removed' };
  } catch (error) {
    return renderError(error);
  }
}

export async function fetchAdminProductDetails(productId: string) {
  await getAdminUser();
  const product = await db.product.findUnique({
    where: {
      id: productId,
    },
  });

  if (!product) redirect('/admin/products');

  return product;
}

export async function updateProductAction(prevState: any, formData: FormData) {
  await getAdminUser();

  try {
    const productId = formData.get('id') as string;
    const rawData = Object.fromEntries(formData);

    const validatedFields = validateWithZodSchema(productSchema, rawData);

    await db.product.update({
      where: {
        id: productId,
      },
      data: {
        ...validatedFields,
      },
    });

    revalidatePath(`/admin/products/${productId}/edit`);
    return { message: 'Product updated successfully' };
  } catch (error) {
    return renderError(error);
  }
}

/* Favorites */
export async function fetchFavoriteId({ productId }: { productId: string }) {
  const user = await getAuthUser();
  const favorite = await db.favorite.findFirst({
    where: {
      productId,
      clerkId: user.id,
    },
    select: {
      id: true,
    },
  });
  return favorite?.id || null;
}

export async function toggleFavoriteAction(prevState: {
  productId: string;
  favoriteId: string | null;
  pathname: string;
}) {
  const user = await getAuthUser();
  const { productId, favoriteId, pathname } = prevState;

  try {
    if (favoriteId) {
      await db.favorite.delete({
        where: {
          id: favoriteId,
        },
      });
    } else {
      await db.favorite.create({
        data: {
          productId,
          clerkId: user.id,
        },
      });
    }
    revalidatePath(pathname);
    return { message: 'toggle favorite action' };
  } catch (error) {
    return renderError(error);
  }
}

export async function fetchUserFavorites() {
  const user = await getAuthUser();
  const favorites = await db.favorite.findMany({
    where: {
      clerkId: user.id,
    },
    include: {
      product: true,
    },
  });
  return favorites;
}

/* Reviews */
export async function createReviewAction(prevState: any, formData: FormData) {
  const user = await getAuthUser();

  try {
    const rawData = Object.fromEntries(formData);
    const validatedFields = validateWithZodSchema(reviewSchema, rawData);
    await db.review.create({
      data: {
        ...validatedFields,
        clerkId: user.id,
      },
    });
    revalidatePath(`/products/${validatedFields.productId}`);
    return { message: 'review submitted successfully' };
  } catch (error) {
    return renderError(error);
  }
}

export async function fetchProductReviews(productId: string) {
  const reviews = await db.review.findMany({
    where: {
      productId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  return reviews;
}

export async function fetchProductReviewsByUser() {
  const user = await getAuthUser();
  const reviews = await db.review.findMany({
    where: {
      clerkId: user.id,
    },
    select: {
      id: true,
      rating: true,
      comment: true,
      product: {
        select: {
          image: true,
          name: true,
        },
      },
    },
  });

  return reviews;
}

export async function deleteReviewAction(prevState: { reviewId: string }) {
  const { reviewId } = prevState;
  const user = await getAuthUser();

  try {
    await db.review.delete({
      where: {
        id: reviewId,
        clerkId: user.id,
      },
    });

    revalidatePath('/reviews');
    return { message: 'Review deleted successfully' };
  } catch (error) {
    return renderError(error);
  }
}

export async function findExistingReview(userId: string, productId: string) {
  return db.review.findFirst({
    where: {
      clerkId: userId,
      productId,
    },
  });
}

export async function fetchProductRating(productId: string) {
  const result = await db.review.groupBy({
    by: ['productId'],
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    },
    where: {
      productId,
    },
  });

  return {
    rating: result[0]?._avg.rating?.toFixed(1) ?? 0,
    count: result[0]?._count.rating ?? 0,
  };
}

/* Cart */
export async function fetchCartItems() {
  const { userId } = auth();

  const cart = await db.cart.findFirst({
    where: {
      clerkId: userId ?? '',
    },
    select: {
      numItemsInCart: true,
    },
  });

  return cart?.numItemsInCart || 0;
}

export async function fetchProduct(productId: string) {
  const product = await db.product.findUnique({
    where: {
      id: productId,
    },
  });

  if (!product) {
    throw new Error('Product not found');
  }
  return product;
}

const includeProductClause = {
  cartItems: {
    include: {
      product: true,
    },
  },
};

export async function fetchOrCreateCart({
  userId,
  errorOnFailure = false,
}: {
  userId: string;
  errorOnFailure?: boolean;
}) {
  let cart = await db.cart.findFirst({
    where: {
      clerkId: userId,
    },
    include: includeProductClause,
  });

  if (!cart && errorOnFailure) {
    throw new Error('Cart not found');
  }

  if (!cart) {
    cart = await db.cart.create({
      data: {
        clerkId: userId,
      },
      include: includeProductClause,
    });
  }

  return cart;
}

export async function updateOrCreateCartItem({
  productId,
  cartId,
  amount,
}: {
  productId: string;
  cartId: string;
  amount: number;
}) {
  let cartItem = await db.cartItem.findFirst({
    where: {
      productId,
      cartId,
    },
  });

  if (cartItem) {
    cartItem = await db.cartItem.update({
      where: {
        id: cartItem.id,
      },
      data: {
        amount: cartItem.amount + amount,
      },
    });
  } else {
    cartItem = await db.cartItem.create({
      data: {
        productId,
        cartId,
        amount,
      },
    });
  }
}

export async function updateCart(cart: Cart) {
  const cartItems = await db.cartItem.findMany({
    where: {
      cartId: cart.id,
    },
    include: {
      product: true, // Include the related product
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  let numItemsInCart = 0;
  let cartTotal = 0;

  for (const item of cartItems) {
    numItemsInCart += item.amount;
    cartTotal += item.amount * item.product.price;
  }
  const tax = cart.taxRate * cartTotal;
  const shipping = cartTotal ? cart.shipping : 0;
  const orderTotal = cartTotal + tax + shipping;

  const currentCart = await db.cart.update({
    where: {
      id: cart.id,
    },

    data: {
      numItemsInCart,
      cartTotal,
      tax,
      orderTotal,
    },
    include: includeProductClause,
  });
  return { currentCart, cartItems };
}

export async function addToCartAction(prevState: any, formData: FormData) {
  const user = await getAuthUser();

  try {
    const productId = formData.get('productId') as string;
    const amount = Number(formData.get('amount'));
    await fetchProduct(productId);

    const cart = await fetchOrCreateCart({ userId: user.id });
    await updateOrCreateCartItem({ productId, cartId: cart.id, amount });
    await updateCart(cart);
  } catch (error) {
    return renderError(error);
  }
  redirect('/cart');
}

export async function removeCartItemAction(prevState: any, formData: FormData) {
  const user = await getAuthUser();
  try {
    const cartItemId = formData.get('id') as string;
    const cart = await fetchOrCreateCart({
      userId: user.id,
      errorOnFailure: true,
    });
    await db.cartItem.delete({
      where: {
        id: cartItemId,
        cartId: cart.id,
      },
    });

    await updateCart(cart);
    revalidatePath('/cart');
    return { message: 'Item removed from cart' };
  } catch (error) {
    return renderError(error);
  }
}

export async function updateCartItemAction({
  amount,
  cartItemId,
}: {
  amount: number;
  cartItemId: string;
}) {
  const user = await getAuthUser();

  try {
    const cart = await fetchOrCreateCart({
      userId: user.id,
      errorOnFailure: true,
    });
    await db.cartItem.update({
      where: {
        id: cartItemId,
        cartId: cart.id,
      },
      data: {
        amount,
      },
    });
    await updateCart(cart);
    revalidatePath('/cart');
    return { message: 'cart updated' };
  } catch (error) {
    return renderError(error);
  }
}
