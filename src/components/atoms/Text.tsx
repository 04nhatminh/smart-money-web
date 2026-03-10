import React from 'react';

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: 'body' | 'caption' | 'small';
}

export const Text: React.FC<TextProps> = ({ variant = 'body', className = '', ...props }) => {
  const variantStyles = {
    body: 'text-base text-gray-700',
    caption: 'text-sm text-gray-600',
    small: 'text-xs text-gray-500',
  };

  return <p className={`${variantStyles[variant]} ${className}`} {...props} />;
};
