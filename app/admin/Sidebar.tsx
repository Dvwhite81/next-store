'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { adminLinks } from '@/utils/links';
import { Button } from '@/components/ui/button';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside>
      {adminLinks.map((link) => {
        const isActivePage = pathname === link.href;
        const variant = isActivePage ? 'default' : 'ghost';

        return (
          <Button
            key={link.href}
            className="w-full mb-2 capitalize font-normal justify-start"
            variant={variant}
            asChild
          >
            <Link href={link.href}>{link.label}</Link>
          </Button>
        );
      })}
    </aside>
  );
}
