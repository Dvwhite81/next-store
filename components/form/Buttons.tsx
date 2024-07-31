'use client';

import { ReloadIcon } from '@radix-ui/react-icons';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SignInButton } from '@clerk/nextjs';
import { FaRegHeart, FaHeart } from 'react-icons/fa';
import { LuTrash2, LuPenSquare, LuTrash } from 'react-icons/lu';

type btnSize = 'default' | 'lg' | 'sm';

type SubmitButtonProps = {
  className?: string;
  text?: string;
  size?: btnSize;
};

export function SubmitButton({
  className = '',
  text = 'submit',
  size = 'lg',
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className={cn('capitalize', className)}
      size={size}
    >
      {pending ? (
        <>
          <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
          Please wait...
        </>
      ) : (
        text
      )}
    </Button>
  );
}

type ActionType = 'edit' | 'delete';

export function IconButton({ actionType }: { actionType: ActionType }) {
  const { pending } = useFormStatus();

  const renderIcon = () => {
    switch (actionType) {
      case 'edit':
        return <LuPenSquare />;
      case 'delete':
        return <LuTrash />;
      default:
        const never: never = actionType;
        throw new Error(`Invalid action type: ${never}`);
    }
  };

  return (
    <Button
      className="p-2 cursor-pointer"
      type="submit"
      size="icon"
      variant="link"
    >
      {pending ? <ReloadIcon className="animate-spin" /> : renderIcon()}
    </Button>
  );
}

export function CardSignInButton() {
  return (
    <SignInButton mode="modal">
      <Button
        className="p-2 cursor-pointer"
        type="button"
        size="icon"
        variant="outline"
        asChild
      >
        <FaRegHeart />
      </Button>
    </SignInButton>
  );
}

export function CardSubmitButton({ isFavorite }: { isFavorite: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      className="p-2 cursor-pointer"
      type="submit"
      size="icon"
      variant="outline"
    >
      {pending ? (
        <ReloadIcon className=" animate-spin" />
      ) : isFavorite ? (
        <FaHeart />
      ) : (
        <FaRegHeart />
      )}
    </Button>
  );
}
