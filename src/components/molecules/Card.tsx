import React from 'react';
import { Heading, Text, Button } from '@/components/atoms';

interface CardProps {
  title: string;
  description?: string;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  onAction,
  actionLabel = 'Action',
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border border-gray-200 ${className}`}>
      <Heading level={3} className="mb-2">
        {title}
      </Heading>
      {description && <Text variant="caption" className="mb-4">{description}</Text>}
      {onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
