import { useRef, useCallback } from 'react';

/**
 * Custom hook to handle long press (touch & hold / mouse press & hold)
 * Distinguishes between quick taps, long presses, and scrolling gestures.
 */
export function useLongPress(onLongPress, onClick, { delay = 450 } = {}) {
  const timerRef = useRef(null);
  const isLongPressActiveRef = useRef(false);
  const startCoordsRef = useRef({ x: 0, y: 0 });

  const start = useCallback((e) => {
    // Prevent right-click or other mouse buttons
    if (e.button && e.button !== 0) return;

    isLongPressActiveRef.current = false;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startCoordsRef.current = { x: clientX, y: clientY };

    timerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      if (onLongPress) {
        onLongPress(e);
      }
    }, delay);
  }, [onLongPress, delay]);

  const clear = useCallback((e, shouldTriggerClick = false) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (shouldTriggerClick && !isLongPressActiveRef.current && onClick) {
      onClick(e);
    }
  }, [onClick]);

  const move = useCallback((e) => {
    if (!timerRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = Math.abs(clientX - startCoordsRef.current.x);
    const dy = Math.abs(clientY - startCoordsRef.current.y);

    // If moved more than 10px (e.g. user is scrolling page), cancel
    if (dx > 10 || dy > 10) {
      clear(e, false);
    }
  }, [clear]);

  return {
    onMouseDown: start,
    onMouseUp: (e) => clear(e, true),
    onMouseLeave: (e) => clear(e, false),
    onTouchStart: start,
    onTouchEnd: (e) => clear(e, true),
    onTouchMove: move,
  };
}
