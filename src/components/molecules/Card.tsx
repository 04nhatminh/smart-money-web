'use client';

import React from 'react';
import { Heading, Text, Button } from '@/components/atoms';
import { useTheme } from '@/context';

interface CardProps {
  title: string;
  description?: string;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  onAction,
  actionLabel = 'Action',
  className = '',
  children,
}) => {
  const { colors } = useTheme();

  return (
    <div className={`rounded-lg shadow-lg hover:shadow-2xl border p-6 transition-shadow ${className}`} style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.light }}>
      <Heading level={3} className="mb-2">
        {title}
      </Heading>
      {description && <Text variant="caption" className="mb-4">{description}</Text>}
      {children && <div className="mb-4">{children}</div>}
      {onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
