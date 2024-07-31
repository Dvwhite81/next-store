'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from '../ui/input';

export default function NavSearch() {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const [search, setSearch] = useState(
    searchParams.get('search')?.toString() || ''
  );

  const handleSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams);

    if (value) params.set('search', value);
    else params.delete('search');

    replace(`/products?${params.toString()}`);
  }, 300);

  useEffect(() => {
    if (!searchParams.get('search')) {
      setSearch('');
    }
  }, [searchParams]);

  return (
    <Input
      className="max-w-xs dark:bg-muted"
      type="search"
      placeholder="search product..."
      value={search}
      onChange={({ target }) => {
        setSearch(target.value);
        handleSearch(target.value);
      }}
    />
  );
}
