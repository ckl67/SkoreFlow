import { useContext, useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import type { PageViewport } from 'pdfjs-dist';
import type { Annotation } from '../../../../../shared/types/score';

import { getRandomId } from '../../../tools/tools';

import { AnnotationToolsContext } from './AnnotationTools';

type Props = {
  viewport: PageViewport;
  pageNumber: number;
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  onCreate: (annotation: Annotation) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateGeometry: (id: string, newGeometry: Annotation['geometry']) => void;
};

// Information needed for move
type DragState = {
  id: string;
  startPdfX: number;
  startPdfY: number;
  initialGeometry: Annotation['geometry'];
  layerLeft: number;
  layerTop: number;
};

/**
 * AnnotationLayer handles user click interactions to create geometric annotations
 * and renders existing annotations onto the page by translating PDF coordinates
 * into viewport (screen) coordinates using the PDF.js viewport scaling.
 * It’s a key component! It provides the crucial link between the screen space (browser pixels)
 * and the PDF space (vector coordinates) thanks to PDF.js’s ‘magic’ methods:
 * `convertToPdfPoint` and `convertToViewportPoint`.
 *
 * @param props - The component properties.
 * @param props.viewport - The current PageViewport object from PDF.js.
 * @param props.pageNumber - The page number associated with this annotation layer.
 * @param props.annotations - The array of annotation objects for the score.
 * @param props.selectedAnnotationId - The ID of the currently selected annotation, if any.
 * @param props.onCreate - Callback function triggered when a new annotation is created.
 * @param props.onSelect - Callback function triggered when an existing annotation is clicked/selected.
 * @param props.onDelete - Callback function triggered when an annotation is requested for deletion.
 * @returns The rendered interactive AnnotationLayer component.
 */
export default function AnnotationLayer({
  viewport,
  pageNumber,
  annotations,
  selectedAnnotationId,
  onCreate,
  onSelect,
  onDelete,
  onUpdateGeometry,
}: Props) {
  const annotationToolsContext = useContext(AnnotationToolsContext);
  if (!annotationToolsContext) {
    throw new Error(
      'useAnnotationTools must be used within an AnnotationTools provider'
    );
  }

  // Context consummation
  const {
    activeTool,
    circleDiameter,
    strokeWidth,
    rectangleWidth,
    rectangleHeight,
    fontSize,
    color,
  } = annotationToolsContext;

  // 'drag' preserves the initial position and geometry of the annotation.
  // This allows each displacement to be calculated from the starting position,
  // rather than accumulating displacement errors.
  const [drag, setDrag] = useState<DragState | null>(null);
  const suppressNextClick = useRef(false);

  // Move annotation
  const handleMouseDown = (
    event: MouseEvent<HTMLDivElement>,
    annotation: Annotation
  ) => {
    if (event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    // `parentElement` refers to the layer containing the annotations.
    // It is relative to this layer that we calculate the pointer’s coordinates
    const layerRect =
      event.currentTarget.parentElement?.getBoundingClientRect();

    if (!layerRect) return;

    const [startPdfX, startPdfY] = viewport.convertToPdfPoint(
      event.clientX - layerRect.left,
      event.clientY - layerRect.top
    );

    onSelect(annotation.id);

    setDrag({
      id: annotation.id,
      startPdfX,
      startPdfY,
      initialGeometry: annotation.geometry,
      layerLeft: layerRect.left,
      layerTop: layerRect.top,
    });
  };

  //Create Annotations
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'circle' && activeTool !== 'rectangle') return;

    if (suppressNextClick.current) {
      suppressNextClick.current = false;
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    const viewportX = event.clientX - rect.left;
    const viewportY = event.clientY - rect.top;

    const [pdfX, pdfY] = viewport.convertToPdfPoint(viewportX, viewportY);

    const annotation: Annotation = {
      id: getRandomId(),
      page: pageNumber,
      type: activeTool,
      geometry:
        activeTool === 'circle'
          ? {
              x: pdfX,
              y: pdfY,
              radius: circleDiameter / (2 * viewport.scale),
            }
          : {
              x: pdfX,
              y: pdfY,
              width: rectangleWidth / viewport.scale,
              height: rectangleHeight / viewport.scale,
            },
      style: {
        color,
        strokeWidth,
        opacity: 1,
      },
    };

    onCreate(annotation);
  };

  // Handling mouse movement
  useEffect(() => {
    if (!drag) return;

    const handleMouseMove = (event: globalThis.MouseEvent) => {
      const [pdfX, pdfY] = viewport.convertToPdfPoint(
        event.clientX - drag.layerLeft,
        event.clientY - drag.layerTop
      );

      const dx = pdfX - drag.startPdfX;
      const dy = pdfY - drag.startPdfY;

      onUpdateGeometry(drag.id, {
        ...drag.initialGeometry,
        x: drag.initialGeometry.x + dx,
        y: drag.initialGeometry.y + dy,
      });

      suppressNextClick.current = true;
    };

    const handleMouseUp = () => {
      setDrag(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [drag, viewport, onUpdateGeometry]);

  return (
    <div
      className="pointer-events-auto absolute inset-0"
      onClick={handleClick}
    >
      {/*Pass through all the annotations to display them on screen */}
      {annotations.map((annotation) => {
        if (annotation.type !== 'circle' && annotation.type !== 'rectangle') {
          return null;
        }

        const [x, y] = viewport.convertToViewportPoint(
          annotation.geometry.x,
          annotation.geometry.y
        );

        const isSelected = selectedAnnotationId === annotation.id;

        // For each annotation, we have defined a onClick event
        // onClick will launch onSelect(annotation.id);

        const border = `${
          isSelected ? 4 : annotation.style.strokeWidth
        }px solid ${annotation.style.color}`;

        if (annotation.type === 'rectangle') {
          const width = (annotation.geometry.width ?? 0) * viewport.scale;
          const height = (annotation.geometry.height ?? 0) * viewport.scale;

          //-----------------
          // rectangle
          //-----------------
          return (
            <div
              key={annotation.id}
              className="pointer-events-auto absolute hover:bg-black/10 cursor-pointer"
              onClick={(event) => {
                event.stopPropagation();
                onSelect(annotation.id);
              }}
              onMouseDown={(event) => handleMouseDown(event, annotation)}
              style={{
                left: x,
                top: y,
                width,
                height,
                border,
                opacity: annotation.style.opacity ?? 1,
              }}
            />
          );
        }

        //-----------------
        // circle
        // rounded-full (Tailwind class): transforms a square into a circle.
        //-----------------
        const radius = (annotation.geometry.radius ?? 0) * viewport.scale;
        return (
          <div
            key={annotation.id}
            className="pointer-events-auto absolute rounded-full  hover:bg-black/10 cursor-pointer"
            onClick={(event) => {
              event.stopPropagation();
              onSelect(annotation.id);
            }}
            onMouseDown={(event) => handleMouseDown(event, annotation)}
            style={{
              left: x - radius,
              top: y - radius,
              width: radius * 2,
              height: radius * 2,
              border,
              opacity: annotation.style.opacity ?? 1,
            }}
          />
        );
      })}
    </div>
  );
}
