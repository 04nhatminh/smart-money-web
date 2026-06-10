'use client';

import React from 'react';
import { Heading, Text } from '@/components/atoms';
import { useTheme } from '@/context';

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  className = '',
}) => {
  const { colors } = useTheme();

  return (
    <div
      className={`p-8 rounded-lg transition-all hover:shadow-lg hover:-translate-y-1 min-h-64 ${className}`}
      style={{
        backgroundColor: colors.surface.primary,
        borderColor: colors.border.light,
        borderWidth: '1px',
      }}
    >
      {/* Icon */}
      {icon && (
        <div className="mb-4">
          {icon}
        </div>
      )}

      {/* Title */}
      <Heading level={3} className="mb-3">
        {title}
      </Heading>

      {/* Description */}
      <Text variant="body" style={{ color: colors.text.secondary }}>
        {description}
      </Text>
    </div>
  );
};
