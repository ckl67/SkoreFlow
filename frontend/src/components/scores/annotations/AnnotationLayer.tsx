import { useContext, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import type { PageViewport } from 'pdfjs-dist';
import type { Annotation } from '../../../../../shared/types/score';
import { getRandomId } from '../../../tools/tools';

import { AnnotationItem } from './AnnotationItem';
import { useAnnotationDrag } from '../../../hooks/scores/annotations/useAnnotationDrag';
import { useAnnotationDraw } from '../../../hooks/scores/annotations/useAnnotationDraw';
import { AnnotationToolsContext } from '../../../components/scores/annotations/AnnotationTools';

type Props = {
  viewport: PageViewport;
  pageNumber: number;
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  onCreate: (annotation: Annotation) => void;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onUpdateGeometry: (id: string, newGeometry: Annotation['geometry']) => void;
};

/**
 * AnnotationLayer handles user click interactions to create geometric annotations
 * and renders existing annotations onto the page by translating PDF coordinates
 * into viewport (screen) coordinates using the PDF.js viewport scaling.
 * It’s a key component! It provides the crucial link between the screen space (browser pixels)
 * and the PDF space (vector coordinates) thanks to PDF.js’s methods: `convertToPdfPoint` and `convertToViewportPoint`.
 *
 * @param props - The component properties.
 * @param props.viewport - The current PageViewport object from PDF.js.
 * @param props.pageNumber - The page number associated with this annotation layer.
 * @param props.annotations - The array of annotation objects for the score.
 * @param props.selectedAnnotationId - The ID of the currently selected annotation, if any.
 * @param props.onCreate - Callback function triggered when a new annotation is created.
 * @param props.onSelect - Callback function triggered when an existing annotation is clicked/selected.
 * @param props.onDelete - Callback function triggered when an annotation is requested for deletion.
 * @param props.onUpdateGeometry - - Callback function triggered when an New geometry is requested
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
  //---------------------------
  // 0. Context
  //---------------------------
  const annotationToolsContext = useContext(AnnotationToolsContext);
  if (!annotationToolsContext) {
    throw new Error(
      'useAnnotationTools must be used within an AnnotationTools provider'
    );
  }
  const { activeTool, strokeWidth, color, fontSize } = annotationToolsContext;

  //---------------------------
  // 1. Handle : suppressNextClick
  // The browser automatically triggers a click event immediately after the mouseup.
  // We have to handle this event
  //  If we do nothing, this ‘automatic’ click will land on the layer and CAN
  //  do a unwanted action from occurring where you have just finished drawing.
  // The value changes in the cache, ‘behind the scenes’ without rerender
  //---------------------------
  const suppressNextClick = useRef(false);

  //---------------------------
  // 2. Overview of Mouse Move
  // * handleMouseDownDrag
  // * handleMouseDownDraw
  // These Functions are relative to the MOVE of the mouse
  //    When we start MOVE the mouse
  //      - Create : drag and drop (for example, to draw a rectangle or an arrow) or
  //      - move or Modify an annotation or
  //  We perform a sequence: mousedown -> mousemove (0 x several times) -> mouseup.
  //  The problem is that the browser automatically triggers a click event immediately after the mouseup.
  //---------------------------

  //---------------------------
  // 2.1 Hook for creating-drawing a new shape-annotation from scratch
  //  handleMouseDownDraw : Expression function
  //    Attachment: will be attached to The global background container (<div onMouseDown={handleMouseDown} >).
  //    Role: It detects clicks made in empty space (on the score, where there are no annotations).
  //    What: It is used to draw a new shape (start drawing a circle, a rectangle or an arrow by dragging the mouse).
  //---------------------------
  const { handleMouseDownDraw, preview } = useAnnotationDraw({
    viewport,
    pageNumber,
    onCreate,
    suppressNextClick,
  });

  //---------------------------
  // 2.2. Hook for moving an existing annotation
  //  handleMouseDownDrag : Expression function
  //    Attachment: On each AnnotationItem (onMouseDown={handleMouseDownDrag})..
  //    Role: It detects clicks made on an existing annotation
  //    What: It is used to move (drag and drop) or resize this specific annotation to a different position.
  //---------------------------
  const { handleMouseDownDrag } = useAnnotationDrag({
    viewport,
    onSelect,
    onUpdateGeometry,
    suppressNextClick,
  });

  //---------------------------
  // 3. Hook Text input
  //---------------------------
  const [textInput, setTextInput] = useState<{
    pdfX: number;
    pdfY: number;
    viewportX: number;
    viewportY: number;
  } | null>(null);

  //---------------------------
  // Handle Real Click or non wanted click after move
  //---------------------------
  const handleLayerClick = (event: MouseEvent<HTMLDivElement>) => {
    console.log(
      '[handleLayerClick] <Click> suppressNextClick :',
      suppressNextClick.current
    );

    if (suppressNextClick.current) {
      console.log(
        '[handleLayerClick] Unwanted Click (suppressNextClick : true-->false) !'
      );
      suppressNextClick.current = false;
      return;
    }

    // 2. This is a real ‘click into the viewport
    onSelect(null);

    // 3. Next, if the active tool is text, we handle the addition of the text
    if (activeTool !== 'text') return;

    const rect = event.currentTarget.getBoundingClientRect();

    const viewportX = event.clientX - rect.left;
    const viewportY = event.clientY - rect.top;

    const [pdfX, pdfY] = viewport.convertToPdfPoint(viewportX, viewportY);

    setTextInput({
      pdfX,
      pdfY,
      viewportX,
      viewportY,
    });
  };

  return (
    <div
      className="pointer-events-auto absolute inset-0"
      // Here We Move
      onMouseDown={handleMouseDownDraw}
      // Here We click
      onClick={handleLayerClick}
    >
      {textInput && (
        <input
          autoFocus
          type="text"
          placeholder="Type your text..."
          className="absolute bg-white/90 border border-blue-500 rounded px-1 shadow-md z-50 outline-none"
          style={{
            left: textInput.viewportX,
            top: textInput.viewportY,
            fontSize: `${fontSize * viewport.scale}px`,
            color,
          }}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              const value = event.currentTarget.value.trim();

              if (value) {
                onCreate({
                  id: getRandomId(),
                  page: pageNumber,
                  type: 'text',
                  textContent: value,
                  geometry: {
                    x1: textInput.pdfX,
                    y1: textInput.pdfY,
                  },
                  style: {
                    color,
                    strokeWidth,
                    fontSize,
                    opacity: 1,
                  },
                });
              }

              setTextInput(null);
            } else if (event.key === 'Escape') {
              setTextInput(null);
            }
          }}
          onBlur={() => setTextInput(null)}
        />
      )}
      {/* The temporary geometry must be included to AnnotationLayer */}
      {preview?.type === 'circle' &&
        (() => {
          const [x, y] = viewport.convertToViewportPoint(preview.x, preview.y);

          const radius = preview.radius * viewport.scale;

          return (
            <div
              className="pointer-events-none absolute rounded-full"
              style={{
                left: x - radius,
                top: y - radius,
                width: radius * 2,
                height: radius * 2,
                border: `${strokeWidth}px solid ${color}`,
                opacity: 0.7,
              }}
            />
          );
        })()}
      {preview?.type === 'rectangle' &&
        (() => {
          return (
            <div
              className="pointer-events-none absolute"
              style={{
                left: preview.x1,
                top: preview.y1,
                width: preview.width,
                height: preview.height,
                border: `${strokeWidth}px solid ${color}`,
                opacity: 0.7,
              }}
            />
          );
        })()}
      {preview?.type === 'arrow' &&
        (() => {
          const [x1, y1] = viewport.convertToViewportPoint(
            preview.x1,
            preview.y1
          );
          const [x2, y2] = viewport.convertToViewportPoint(
            preview.x2,
            preview.y2
          );
          console.log('preview.x', preview.x1, 'x1', x1);
          return (
            <svg className="pointer-events-none absolute inset-0 overflow-visible">
              <line
                x1={preview.x1}
                y1={preview.y1}
                x2={preview.x2}
                y2={preview.y2}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity={0.7}
              />
            </svg>
          );
        })()}
      {annotations.map((annotation) => (
        <AnnotationItem
          key={annotation.id}
          annotation={annotation}
          viewport={viewport}
          isSelected={selectedAnnotationId === annotation.id}
          onDelete={onDelete}
          onSelect={onSelect}
          onMouseDown={handleMouseDownDrag}
        />
      ))}
    </div>
  );
}
