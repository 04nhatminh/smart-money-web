import { useEffect, useRef } from 'react';

export type ScrollAnimationVariant =
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'zoom-in'
  | 'flip-x';

interface UseScrollAnimationOptions {
  variant?: ScrollAnimationVariant;
  threshold?: number;
  rootMargin?: string;
  delay?: number;
}

/**
 * Custom hook that uses IntersectionObserver to toggle CSS classes
 * for scroll-triggered animations.
 *
 * The element starts with `.sr-hidden` and gains `.sr-visible` when it
 * enters the viewport. When it leaves the viewport the classes are reset,
 * so the animation replays every time the element scrolls back into view.
 */
export const useScrollAnimation = <T extends HTMLElement = HTMLDivElement>({
  variant = 'fade-up',
  threshold = 0.15,
  rootMargin = '0px 0px -60px 0px',
  delay = 0,
}: UseScrollAnimationOptions = {}) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Set initial classes
    el.classList.add('sr-hidden', `sr-${variant}`);
    if (delay > 0) {
      el.style.transitionDelay = `${delay}ms`;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.remove('sr-hidden');
          el.classList.add('sr-visible');
          // Disconnect after first reveal — prevents flicker when scrolling slowly
          // at the threshold boundary (element repeatedly entering/leaving trigger zone)
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      el.classList.remove('sr-hidden', 'sr-visible', `sr-${variant}`);
      if (delay > 0) {
        el.style.transitionDelay = '';
      }
    };
  }, [variant, threshold, rootMargin, delay]);

  return ref;
};
