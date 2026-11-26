import React, { useEffect, useRef, useState } from 'react';

const descriptionClassName =
  'text-[12px] leading-[18px] text-[#65676B] dark:text-[#B0B3B8] whitespace-pre-wrap break-words';

export default function ExpandableDescription({ text }) {
  const measureRef = useRef(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
    const measureElement = measureRef.current;
    const container = measureElement?.parentElement;

    if (!measureElement || !container) {
      setHasOverflow(false);
      setExpanded(false);
      return undefined;
    }

    const measureOverflow = () => {
      setHasOverflow(measureElement.scrollHeight > measureElement.clientHeight + 1);
    };

    measureOverflow();
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(measureOverflow)
      : null;
    resizeObserver?.observe(container);
    window.addEventListener('resize', measureOverflow);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', measureOverflow);
    };
  }, [text]);

  if (!text) return null;

  return (
    <div className="relative mt-1 min-w-0">
      <p className={`${descriptionClassName} ${expanded ? '' : 'line-clamp-2'}`}>
        {text}
      </p>
      <p
        ref={measureRef}
        aria-hidden="true"
        className={`pointer-events-none invisible absolute left-0 top-0 max-h-[36px] w-full overflow-hidden ${descriptionClassName}`}
      >
        {text}
      </p>
      {hasOverflow && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="mt-1 flex min-h-8 w-full items-center gap-2 border-0 bg-transparent p-0 text-[9px] font-bold tracking-wide text-[var(--theme-primary)]"
        >
          <span className="h-px flex-1 bg-[#E5E5EA] dark:bg-[#38383A]" />
          <span>{expanded ? 'READ LESS' : 'READ MORE'}</span>
          <span className="h-px flex-1 bg-[#E5E5EA] dark:bg-[#38383A]" />
        </button>
      )}
    </div>
  );
}
