import { Input } from '../ui/input';

export default function NavSearch() {
  return (
    <Input
      className="max-w-xs dark:bg-muted"
      type="search"
      placeholder="search product..."
    />
  );
}
