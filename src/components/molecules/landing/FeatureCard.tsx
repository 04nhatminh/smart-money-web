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
      className={`p-8 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 min-h-64 relative z-10 backdrop-blur-md border ${className}`}
      style={{
        backgroundColor: colors.surface.primary === '#ffffff' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 12, 41, 0.75)',
        borderColor: colors.border.light,
        boxShadow: colors.surface.primary === '#ffffff' ? '0 10px 30px rgba(80, 68, 213, 0.06)' : '0 10px 30px rgba(0, 0, 0, 0.3)',
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
