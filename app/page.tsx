import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div>
      <h1 className="text-3xl">HomePage</h1>
      <Button className="capitalize m-8" variant="outline" size="lg">
        Click Me
      </Button>
    </div>
  );
}
