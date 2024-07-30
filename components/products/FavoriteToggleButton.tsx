import { FaHeart } from 'react-icons/fa';
import { Button } from '@/components/ui/button';

export default function FavoriteToggleButton({
  productId,
}: {
  productId: string;
}) {
  return (
    <Button className="p-2 cursor-pointer" variant="outline" size="icon">
      <FaHeart />
    </Button>
  );
}
