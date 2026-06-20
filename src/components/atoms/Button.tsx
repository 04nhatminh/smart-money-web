'use client';

import React, { useState } from 'react';
import { useTheme } from '@/context';
import { BORDER_RADIUS, SHADOWS, TRANSITIONS } from '@/constants';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  elevation?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  elevation = 'md',
  className = '',
  ...props
}) => {
  const { colors } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm font-semibold',
    md: 'px-4 py-2 text-base font-semibold',
    lg: 'px-6 py-3 text-lg font-semibold',
  };

  const shadowStyles = {
    sm: SHADOWS.sm,
    md: SHADOWS.md,
    lg: SHADOWS.lg,
  };

  const getHoverColor = (v: string) => {
    if (v === 'primary') return colors.interactive.secondary;
    if (v === 'secondary') return colors.interactive.primary;
    return colors.interactive[v as 'danger' | 'success']; // danger and success stay the same
  };

  const variantStyles = {
    primary: {
      backgroundColor: isHovered ? getHoverColor('primary') : colors.interactive.primary,
      color: colors.palette.white,
    } as React.CSSProperties,
    secondary: {
      backgroundColor: isHovered ? getHoverColor('secondary') : colors.interactive.secondary,
      color: colors.palette.white,
    } as React.CSSProperties,
    danger: {
      backgroundColor: isHovered ? getHoverColor('danger') : colors.interactive.danger,
      color: colors.palette.white,
    } as React.CSSProperties,
    success: {
      backgroundColor: isHovered ? getHoverColor('success') : colors.interactive.success,
      color: colors.palette.white,
    } as React.CSSProperties,
  };

  const baseStyles = `
    cursor-pointer
    transition-all
    focus:outline-none
    focus:ring-2
    disabled:opacity-60
    disabled:cursor-not-allowed
    hover:shadow-2xl
    active:shadow-lg
    whitespace-nowrap
    shrink-0
  `;

  const { style, ...restProps } = props;

  return (
    <button
      style={{
        ...variantStyles[variant],
        borderRadius: BORDER_RADIUS.xl,
        boxShadow: shadowStyles[elevation],
        transition: TRANSITIONS.base,
        ...(style || {}),
      }}
      className={`${baseStyles} ${sizeStyles[size]} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...restProps}
    />
  );
};
