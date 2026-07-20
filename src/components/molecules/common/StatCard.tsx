'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Card } from '@/components/molecules/common';
import { Heading, Text } from '@/components/atoms';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor?: string;
  textColor?: string;
  trend?: {
    direction: 'up' | 'down';
    percentage: number;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  bgColor,
  textColor,
  trend,
}) => {
  const { colors } = useTheme();

  return (
    <Card className="p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <Heading level={4}>
          {label}
        </Heading>
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: bgColor || colors.surface.secondary }}
        >
          {icon}
        </div>
      </div>
      <div>
        <Heading
          level={2}
          className="mb-2 break-all"
          style={{
            fontSize: 'clamp(1.15rem, 5.5vw, 1.875rem)',
            wordBreak: 'break-word',
          }}
        >
          {value}
        </Heading>
        {trend && (
          <Text
            className="text-xs font-medium"
            style={{ color: trend.direction === 'up' ? '#10B981' : '#EF4444' }}
          >
            {trend.direction === 'up' ? '↑' : '↓'} {trend.percentage}%
          </Text>
        )}
      </div>
    </Card>
  );
};
