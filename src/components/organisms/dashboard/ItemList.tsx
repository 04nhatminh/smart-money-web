'use client';

import React from 'react';
import { Card } from '@/components/molecules';
import { Heading, Text } from '@/components/atoms';
import { useTheme } from '@/context';

interface Item {
  id: string;
  title: string;
  description?: string;
  onAction?: () => void;
}

interface ItemListProps {
  items: Item[];
  title?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
}

export const ItemList: React.FC<ItemListProps> = ({
  items,
  title,
  isLoading = false,
  isEmpty = false,
}) => {
  const { colors } = useTheme();

  if (isLoading) {
    return <div className="text-center py-8"><Text style={{ color: colors.text.primary }}>Loading...</Text></div>;
  }

  if (isEmpty) {
    return <div className="text-center py-8"><Text style={{ color: colors.text.secondary }}>No items found</Text></div>;
  }

  return (
    <div>
      {title && <Heading level={2} className="mb-6">{title}</Heading>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Card
            key={item.id}
            title={item.title}
            description={item.description}
            onAction={item.onAction}
            actionLabel="View"
          />
        ))}
      </div>
    </div>
  );
};
