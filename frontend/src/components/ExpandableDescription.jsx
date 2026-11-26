import React, { useEffect, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';

const descriptionClassName =
  'text-[12px] leading-[18px] text-[#65676B] dark:text-[#B0B3B8] whitespace-pre-wrap break-words';
const cardDescriptionClassName =
  'text-[13px] leading-5 text-[#65676B] dark:text-[#B0B3B8] whitespace-pre-wrap break-words';

export default function ExpandableDescription({ text, variant = 'default' }) {
  const measureRef = useRef(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isCardVariant = variant === 'card';

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
    <div className={`relative mt-1 min-w-0 ${isCardVariant ? 'text-left' : ''}`}>
      <p className={`${isCardVariant ? cardDescriptionClassName : descriptionClassName} ${expanded ? '' : 'line-clamp-2'}`}>
        {text}
      </p>
      <p
        ref={measureRef}
        aria-hidden="true"
        className={`pointer-events-none invisible absolute left-0 top-0 w-full overflow-hidden ${
          isCardVariant ? 'max-h-10' : 'max-h-[36px]'
        } ${isCardVariant ? cardDescriptionClassName : descriptionClassName}`}
      >
        {text}
      </p>
      {hasOverflow && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className={`border-0 bg-transparent p-0 text-[var(--theme-primary)] ${
            isCardVariant
              ? 'mt-0.5 inline-flex min-h-11 items-center gap-1 text-[12px] font-semibold italic underline underline-offset-2'
              : 'mt-1 flex min-h-8 w-full items-center gap-2 text-[9px] font-bold tracking-wide'
          }`}
        >
          {isCardVariant ? (
            <>
              <span>{expanded ? 'Read less' : 'Read more'}</span>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={14}
                className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'}
              />
            </>
          ) : (
            <>
              <span className="h-px flex-1 bg-[#E5E5EA] dark:bg-[#38383A]" />
              <span>{expanded ? 'READ LESS' : 'READ MORE'}</span>
              <span className="h-px flex-1 bg-[#E5E5EA] dark:bg-[#38383A]" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
