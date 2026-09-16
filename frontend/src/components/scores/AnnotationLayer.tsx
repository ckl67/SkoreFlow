import type { MouseEvent } from 'react';
import type { PageViewport } from 'pdfjs-dist';

type Annotation = {
  type: 'circle';
  x: number;
  y: number;
  radius: number;
};

type Props = {
  viewport: PageViewport;
  annotation: Annotation;
};

export default function AnnotationLayer({ viewport, annotation }: Props) {
  const [x, y] = viewport.convertToViewportPoint(annotation.x, annotation.y);

  const radius = annotation.radius * viewport.scale;

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();

    const viewportX = event.clientX - rect.left;
    const viewportY = event.clientY - rect.top;

    const [pdfX, pdfY] = viewport.convertToPdfPoint(viewportX, viewportY);

    console.log('Annotation click', {
      viewportX,
      viewportY,
      pdfX,
      pdfY,
    });
  };

  return (
    <div className="pointer-events-auto absolute inset-0" onClick={handleClick}>
      <div
        className="pointer-events-none absolute rounded-full border-2 border-red-500"
        style={{
          left: x - radius,
          top: y - radius,
          width: radius * 2,
          height: radius * 2,
        }}
      />
    </div>
  );
}
