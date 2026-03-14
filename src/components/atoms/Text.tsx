'use client';

import React from 'react';
import { useTheme } from '@/context';
import { FONT_SIZES, FONT_WEIGHTS } from '@/constants';

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: 'body' | 'caption' | 'small' | 'code';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  weight = 'normal',
  className = '',
  ...props
}) => {
  const { colors } = useTheme();

  const variantStyles = {
    body: {
      fontSize: FONT_SIZES.md,
      color: colors.text.primary,
    },
    caption: {
      fontSize: FONT_SIZES.sm,
      color: colors.text.secondary,
    },
    small: {
      fontSize: FONT_SIZES.xs,
      color: colors.text.tertiary,
    },
    code: {
      fontSize: FONT_SIZES.sm,
      color: colors.interactive.primary,
      fontFamily: 'monospace',
      backgroundColor: colors.background.secondary,
      padding: '0.125rem 0.375rem',
      borderRadius: '0.25rem',
    },
  };

  const fontWeights = {
    light: FONT_WEIGHTS.light,
    normal: FONT_WEIGHTS.normal,
    medium: FONT_WEIGHTS.medium,
    semibold: FONT_WEIGHTS.semibold,
    bold: FONT_WEIGHTS.bold,
  };

  return (
    <p
      style={{
        ...variantStyles[variant],
        fontWeight: fontWeights[weight],
      }}
      className={className}
      {...props}
    />
  );
};
