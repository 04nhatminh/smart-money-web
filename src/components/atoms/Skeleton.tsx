'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

export interface SkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  className = '',
  style,
  count = 1,
}) => {
  const { colors } = useTheme();

  const getBorderRadius = () => {
    switch (variant) {
      case 'circular':
        return '9999px';
      case 'text':
        return '0.375rem';
      case 'rectangular':
      default:
        return '0.75rem';
    }
  };

  const defaultHeight = variant === 'text' ? '1.25rem' : '100%';
  const defaultWidth = '100%';

  const baseStyle: React.CSSProperties = {
    width: width ?? defaultWidth,
    height: height ?? defaultHeight,
    borderRadius: getBorderRadius(),
    backgroundColor: `${colors.border.light}60`,
    ...style,
  };

  const skeletonElement = (index: number) => (
    <div
      key={index}
      className={`animate-pulse ${className}`}
      style={{
        ...baseStyle,
        backgroundImage: `linear-gradient(90deg, ${colors.border.light}30 0%, ${colors.border.light}70 50%, ${colors.border.light}30 100%)`,
        backgroundSize: '200% 100%',
      }}
    />
  );

  if (count > 1) {
    return (
      <div className="space-y-2.5 w-full">
        {Array.from({ length: count }).map((_, i) => skeletonElement(i))}
      </div>
    );
  }

  return skeletonElement(0);
};
