import { useEffect, useState } from 'react';

/**
 * Custom hook that tracks and returns the dynamic width of a DOM container element
 * using the ResizeObserver API.
 *
 * @param containerRef - A React reference object pointing to the target HTMLDivElement.
 * @returns The current measured width of the container in pixels.
 */
export function useContainerWidth(
  containerRef: React.RefObject<HTMLDivElement | null>
) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry?.contentRect.width) setWidth(entry.contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef]);

  console.log('score', '[useContainerWidth] New calculated width:', width);
  //console.log('score', '[useContainerWidth] DOM node:', containerRef.current);

  return width;
}
