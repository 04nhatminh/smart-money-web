'use client';

import React from 'react';
import { useTheme } from '@/context';
import { BORDER_RADIUS, SHADOWS, TRANSITIONS } from '@/constants';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'info';
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

  const variantStyles = {
    primary: {
      backgroundColor: colors.interactive.primary,
      color: colors.text.inverse,
    } as React.CSSProperties,
    secondary: {
      backgroundColor: colors.interactive.secondary,
      color: colors.text.inverse,
    } as React.CSSProperties,
    danger: {
      backgroundColor: colors.interactive.danger,
      color: colors.text.inverse,
    } as React.CSSProperties,
    success: {
      backgroundColor: colors.interactive.success,
      color: colors.text.inverse,
    } as React.CSSProperties,
    info: {
      backgroundColor: colors.interactive.info,
      color: colors.text.inverse,
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
  `;

  return (
    <button
      style={{
        ...variantStyles[variant],
        borderRadius: BORDER_RADIUS.xl,
        boxShadow: shadowStyles[elevation],
        transition: TRANSITIONS.base,
      }}
      className={`${baseStyles} ${sizeStyles[size]} ${className}`}
      {...props}
    />
  );
};
