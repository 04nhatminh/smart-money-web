'use client';

import React from 'react';
import { useScrollAnimation, ScrollAnimationVariant } from '@/hooks/useScrollAnimation';

interface ScrollRevealProps {
  /** The animation variant to use */
  variant?: ScrollAnimationVariant;
  /** Delay in milliseconds before the animation starts (useful for stagger effects) */
  delay?: number;
  /** Fraction of the element that must be visible to trigger the animation (0–1) */
  threshold?: number;
  /** IntersectionObserver rootMargin — shrink bottom margin to trigger earlier */
  rootMargin?: string;
  /** HTML tag to render as the wrapper element */
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * A lightweight wrapper that animates its children into view when the user
 * scrolls to them. Supports 6 animation variants with optional stagger delay.
 *
 * The animation resets when the element leaves the viewport so it replays
 * every time the user scrolls back to that section.
 *
 * @example
 * // Simple fade-up
 * <ScrollReveal variant="fade-up">
 *   <Heading>Hello</Heading>
 * </ScrollReveal>
 *
 * @example
 * // Staggered list
 * {items.map((item, i) => (
 *   <ScrollReveal key={i} variant="zoom-in" delay={i * 100}>
 *     <Card>{item}</Card>
 *   </ScrollReveal>
 * ))}
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  variant = 'fade-up',
  delay = 0,
  threshold = 0.15,
  rootMargin = '0px 0px -60px 0px',
  as: Tag = 'div',
  className,
  style,
  children,
}) => {
  const ref = useScrollAnimation<HTMLDivElement>({ variant, delay, threshold, rootMargin });

  return (
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
};
