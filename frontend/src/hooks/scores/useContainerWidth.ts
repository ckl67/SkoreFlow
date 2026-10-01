import { useEffect, useState } from 'react';

export function useContainerWidth(containerRef: React.RefObject<HTMLDivElement | null>) {
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
