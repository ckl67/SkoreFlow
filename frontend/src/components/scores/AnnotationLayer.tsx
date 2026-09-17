import type { MouseEvent } from 'react';
import type { PageViewport } from 'pdfjs-dist';

import type { Annotation } from '../../../../shared/types/score';

type Props = {
  viewport: PageViewport;
  pageNumber: number;
  annotations: Annotation[];
  onCreate: (annotation: Annotation) => void;
  selectedAnnotationId: string | null;
  onSelect: (id: string) => void;
};

export default function AnnotationLayer({
  viewport,
  pageNumber,
  annotations,
  selectedAnnotationId,
  onCreate,
  onSelect,
}: Props) {
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();

    const viewportX = event.clientX - rect.left;
    const viewportY = event.clientY - rect.top;

    const [pdfX, pdfY] = viewport.convertToPdfPoint(viewportX, viewportY);

    const annotation: Annotation = {
      id: crypto.randomUUID(),
      page: pageNumber,
      type: 'circle',
      geometry: {
        x: pdfX,
        y: pdfY,
        radius: 20,
      },
      style: {
        color: 'red',
        strokeWidth: 2,
        opacity: 1,
      },
    };

    onCreate(annotation);
  };

  return (
    <div className="pointer-events-auto absolute inset-0" onClick={handleClick}>
      {annotations.map((annotation) => {
        if (annotation.type !== 'circle') {
          return null;
        }

        const [x, y] = viewport.convertToViewportPoint(annotation.geometry.x, annotation.geometry.y);

        const radius = (annotation.geometry.radius ?? 0) * viewport.scale;

        return (
          <div
            key={annotation.id}
            className="pointer-events-auto absolute rounded-full"
            onClick={(event) => {
              event.stopPropagation();
              onSelect(annotation.id);
            }}
            style={{
              left: x - radius,
              top: y - radius,
              width: radius * 2,
              height: radius * 2,
              border: `${
                selectedAnnotationId === annotation.id ? 4 : annotation.style.strokeWidth
              }px solid ${annotation.style.color}`,
              opacity: annotation.style.opacity ?? 1,
            }}
          />
        );
      })}
    </div>
  );
}
