'use client';

import React from 'react';
import { Button } from '@/components/atoms';
import { useTheme } from '@/context';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search...',
}) => {
  const [query, setQuery] = React.useState('');
  const { colors } = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-md">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        style={{
          backgroundColor: colors.surface.primary,
          borderColor: colors.border.light,
          color: colors.text.primary,
          outlineColor: colors.interactive.primary,
        }}
        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
      />
      <Button variant="primary" type="submit">
        Search
      </Button>
    </form>
  );
};
