import { useEffect, useState } from 'react';

/**
 * Subscribes to a CSS media query.
 *
 * Uses `addEventListener` where available and falls back to the deprecated
 * `addListener` so older Safari (< 14) and legacy Edge keep working.
 */
export function useMediaQuery(query: string): boolean {
  const getMatch = () =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false;

  const [matches, setMatches] = useState<boolean>(getMatch);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const mql = window.matchMedia(query);
    const onChange = (event: MediaQueryList | MediaQueryListEvent) => setMatches(event.matches);

    // Sync immediately in case the query changed between render and effect.
    setMatches(mql.matches);

    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange as (e: MediaQueryListEvent) => void);
      return () => mql.removeEventListener('change', onChange as (e: MediaQueryListEvent) => void);
    }

    // Safari 13 and below.
    mql.addListener(onChange as (e: MediaQueryListEvent) => void);
    return () => mql.removeListener(onChange as (e: MediaQueryListEvent) => void);
  }, [query]);

  return matches;
}

/** Tailwind breakpoints, mirrored so JS and CSS never drift apart. */
export const BREAKPOINTS = {
  xs: 428,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/** True below the `lg` breakpoint — where the shell switches to drawer mode. */
export const useIsMobileShell = () => useMediaQuery(`(max-width: ${BREAKPOINTS.lg - 1}px)`);

/** True on phone-sized viewports. */
export const useIsPhone = () => useMediaQuery(`(max-width: ${BREAKPOINTS.sm - 1}px)`);

/** True when the primary input is a finger/stylus rather than a mouse. */
export const useIsTouch = () => useMediaQuery('(pointer: coarse)');
