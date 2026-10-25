import type { Annotation } from '../../../../../shared/types/score';
import type { MouseEvent } from 'react';

import type { PageViewport } from 'pdfjs-dist';
// handleMouseDown was originally written for divs (HTMLDivElement);
// it refuses to accept an event from an SVG element (SVGLineElement).
// To fix :  <-- Changed from HTMLDivElement to Element

type Props = {
  annotation: Annotation;
  viewport: PageViewport;
  isSelected: boolean;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  onMouseDown: (event: MouseEvent<Element>, annotation: Annotation) => void;
};

/**
 * Represent 1 Annotation item : either circle/ rectangle /...
 *
 * @param param0
 * @returns
 */
export function AnnotationItem({
  annotation,
  viewport,
  isSelected,
  onDelete,
  onSelect,
  onMouseDown,
}: Props) {
  if (
    annotation.type !== 'circle' &&
    annotation.type !== 'rectangle' &&
    annotation.type !== 'arrow' &&
    annotation.type !== 'text'
  ) {
    return null;
  }

  const [x, y] = viewport.convertToViewportPoint(
    annotation.geometry.x1,
    annotation.geometry.y1
  );

  //-----------------
  // Rectangle
  //-----------------
  if (annotation.type === 'rectangle') {
    const width = (annotation.geometry.width ?? 0) * viewport.scale;
    const height = (annotation.geometry.height ?? 0) * viewport.scale;

    return (
      <div
        key={annotation.id}
        className="pointer-events-auto absolute hover:bg-black/10 cursor-pointer"
        onClick={(event) => {
          event.stopPropagation(); // ‘Stop right there! Don’t pass the event any further up!”
          onSelect(annotation.id);
        }}
        onMouseDown={(event) => onMouseDown(event, annotation)}
        style={{
          left: x,
          top: y,
          width,
          height,
          border: isSelected
            ? '2px dashed blue'
            : `${annotation.style.strokeWidth}px solid ${annotation.style.color}`,
          opacity: annotation.style.opacity ?? 1,
        }}
      >
        {/* The delete button is only displayed if the annotation is selected */}
        {isSelected && (
          <button
            type="button"
            className="absolute -top-3 -right-3 bg-blue-400 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md z-10 pointer-events-auto"
            onClick={(event) => {
              event.stopPropagation(); // Prevents the selection from being triggered
              onDelete(annotation.id); // Deletion function passed via props
            }}
            title="Delete"
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  //-----------------
  // circle
  // rounded-full (Tailwind class): transforms a square into a circle.
  //-----------------
  if (annotation.type === 'circle') {
    const radius = (annotation.geometry.radius ?? 0) * viewport.scale;
    return (
      <div
        key={annotation.id}
        className="pointer-events-auto absolute rounded-full  hover:bg-black/10 cursor-pointer"
        onClick={(event) => {
          event.stopPropagation();
          onSelect(annotation.id);
        }}

        // event is the mouse event automatically passed by React.
        // annotation is the annotation the user is currently entering.
        // onMouseDown(event, annotation) ultimately calls handleMouseDown in AnnotationLayer.
        onMouseDown={(event) => onMouseDown(event, annotation)}
        style={{
          left: x - radius,
          top: y - radius,
          width: radius * 2,
          height: radius * 2,
          border: isSelected
            ? '2px dashed blue'
            : `${annotation.style.strokeWidth}px solid ${annotation.style.color}`,
          opacity: annotation.style.opacity ?? 1,
        }}
      >
        {/* The delete button is only displayed if the annotation is selected */}
        {isSelected && (
          <button
            type="button"
            className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md z-10 pointer-events-auto"
            onClick={(event) => {
              event.stopPropagation(); // Prevents the selection from being triggered
              onDelete(annotation.id); // Deletion function passed via props
            }}
            title="Delete"
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  //-----------------
  // Text
  //-----------------
  if (annotation.type === 'text') {
    const [x, y] = viewport.convertToViewportPoint(
      annotation.geometry.x1 ?? 0,
      annotation.geometry.y1 ?? 0
    );

    const fontSize = (annotation.style.fontSize ?? 14) * viewport.scale;

    return (
      <div
        key={annotation.id}
        className="absolute pointer-events-auto cursor-pointer select-none px-1 rounded hover:bg-black/10 transition-colors"
        onClick={(event) => {
          event.stopPropagation();
          onSelect(annotation.id);
        }}
        onMouseDown={(event) => onMouseDown(event, annotation)}
        style={{
          left: x,
          top: y,
          color: annotation.style.color,
          fontSize: `${fontSize}px`,
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          outline: isSelected ? '2px dashed blue' : 'none',
          opacity: annotation.style.opacity ?? 1,
        }}
      >
        {annotation.textContent}

        {/* The delete button is only displayed if the annotation is selected */}
        {isSelected && (
          <button
            type="button"
            className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md z-10 pointer-events-auto"
            onClick={(event) => {
              event.stopPropagation(); // Prevents the selection from being triggered
              onDelete(annotation.id); // Deletion function passed via props
            }}
            title="Delete"
          >
            ✕
          </button>
        )}
      </div>
    );
  }
  //-----------------
  // Arrow
  //-----------------
  if (annotation.type === 'arrow') {
    const [x1, y1] = viewport.convertToViewportPoint(
      annotation.geometry.x1 ?? 0,
      annotation.geometry.y1 ?? 0
    );

    const [x2, y2] = viewport.convertToViewportPoint(
      annotation.geometry.x2 ?? 0,
      annotation.geometry.y2 ?? 0
    );

    const strokeWidth = isSelected ? 4 : (annotation.style.strokeWidth ?? 2);
    const markerId = `arrowhead-${annotation.id}`;

    // Optional: calculate the centre of the arrow so that the delete button can be positioned neatly there
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    return (
      <div
        key={annotation.id}
        className="absolute inset-0 pointer-events-none"
      >
        {/* SVG only supports drawing the arrow */}
        <svg className="absolute inset-0 overflow-visible">
          <defs>
            <marker
              // -------------------------------------------------------------------------
              // Marker coordinates (0,0 to 5,5):
              //
              // Y=0   (0,0) *------------+ (5,0)
              //             | \          |
              //             |  \         |
              // Y=2.5       |   * (5,2.5)| <--- refY = 2.5 (Vertical centre)
              //             |  /         |      refX = 5   (Tip connected to the line)
              //             | /          |
              // Y=5   (0.5) *------------+ (5.5)
              //             <------------>
              //             markerWidth="5" / markerHeight="5"
              // -------------------------------------------------------------------------
              id={markerId}
              markerWidth="4"
              markerHeight="4"
              refX="4"
              refY="2"
              orient="auto" // Follow the line
            >
              <polygon
                //
                points="0 0, 4 2, 0 4"
                fill={annotation.style.color}
              />
            </marker>
          </defs>

          {/* 1. THE INVISIBLE CLICK AREA (Wider: 16px) */}
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="transparent"
            //stroke="blue"
            strokeWidth={16} // <-- This is where we expand the sensitive area
            strokeLinecap="round"
            className="pointer-events-auto cursor-pointer"
            onClick={(event) => {
              event.stopPropagation();
              onSelect(annotation.id);
            }}
            onMouseDown={(event) => onMouseDown(event, annotation)}
          />

          {/* 2. THE LINE VISIBLE ON TOP (pointer-events-none to allow the transparency to take effect) */}
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={isSelected ? 'blue' : annotation.style.color}
            strokeWidth={isSelected ? 2 : strokeWidth}
            strokeDasharray={isSelected ? '6 4' : undefined}
            strokeLinecap="round"
            markerEnd={`url(#${markerId})`}
            className="pointer-events-none"
            style={{
              opacity: annotation.style.opacity ?? 1,
            }}
          />
        </svg>

        {/* The delete button is a standard HTML element positioned in the centre of the arrow (or at x2, y2)
            h-6 w-6: circular button measuring 24 × 24 px.
            flex items-center justify-center: centres the cross.
            -translate-x-1/2 -translate-y-1/2: centres the button on the middle of the arrow.
        */}
        {isSelected && (
          <button
            type="button"
            className="absolute z-10 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-600 text-xs text-white shadow-md hover:bg-red-700 pointer-events-auto"
            style={{
              left: midX,
              top: midY,
            }}
            onClick={(event) => {
              event.stopPropagation();
              onDelete(annotation.id);
            }}
            title="Delete"
          >
            ✕
          </button>
        )}
      </div>
    );
  }
}
