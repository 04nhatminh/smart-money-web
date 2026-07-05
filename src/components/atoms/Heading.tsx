'use client';

import React from 'react';
import { useTheme } from '@/context';
import { FONT_SIZES, FONT_WEIGHTS } from '@/constants';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export const Heading: React.FC<HeadingProps> = ({ level = 1, className = '', style, ...props }) => {
  const { colors } = useTheme();

  const levelMap = {
    1: 'h1',
    2: 'h2',
    3: 'h3',
    4: 'h4',
    5: 'h5',
    6: 'h6',
  } as const;

  const sizeStyles = {
    1: FONT_SIZES['4xl'],
    2: FONT_SIZES['3xl'],
    3: FONT_SIZES['2xl'],
    4: FONT_SIZES.xl,
    5: FONT_SIZES.lg,
    6: FONT_SIZES.md,
  };

  const Component = levelMap[level] as any;

  return (
    <Component
      style={{
        fontSize: sizeStyles[level],
        fontWeight: FONT_WEIGHTS.bold,
        color: colors.text.primary,
        lineHeight: '1.2',
        margin: '0',
        ...style,
      }}
      className={className}
      {...props}
    />
  );
};
