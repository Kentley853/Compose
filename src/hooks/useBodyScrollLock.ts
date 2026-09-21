import { useEffect } from 'react';

/**
 * Locks background scrolling while an overlay (drawer, modal, sheet) is open.
 *
 * iOS Safari ignores `overflow: hidden` on <body>, so the body is pinned with
 * `position: fixed` and the scroll offset is restored on unlock. The gap left
 * by a hidden desktop scrollbar is compensated so the layout doesn't jump.
 */
export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') return;

    const { body, documentElement } = document;
    const scrollY = window.scrollY;
    const scrollbarGap = window.innerWidth - documentElement.clientWidth;

    const previous = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
    };

    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    if (scrollbarGap > 0) {
      body.style.paddingRight = `${scrollbarGap}px`;
    }

    return () => {
      body.style.overflow = previous.overflow;
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      body.style.paddingRight = previous.paddingRight;
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}
