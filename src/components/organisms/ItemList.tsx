import React from 'react';
import { Card } from '@/components/molecules';
import { Heading } from '@/components/atoms';

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
  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (isEmpty) {
    return <div className="text-center py-8 text-gray-500">No items found</div>;
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
