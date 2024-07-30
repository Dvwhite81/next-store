'use client';

import Link from 'next/link';
import { SignOutButton } from '@clerk/nextjs';
import { useToast } from '../ui/use-toast';

export default function SignOutLink() {
  const { toast } = useToast();

  function handleLogout() {
    toast({ description: 'Logging Out...' })
  }
  
  return (
    <SignOutButton>
      <Link className="w-full text-left" href="/" onClick={handleLogout} >
        Log Out
      </Link>
    </SignOutButton>
  );
}
