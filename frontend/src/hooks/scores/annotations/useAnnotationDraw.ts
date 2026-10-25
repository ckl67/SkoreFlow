//cspell:ignore déposé glissé
import { useContext, useEffect, useRef, useState } from 'react';

import type { MouseEvent } from 'react';
import type { PageViewport } from 'pdfjs-dist';
import type { Annotation } from '../../../../../shared/types/score';

import { getRandomId } from '../../../tools/tools';
import { AnnotationToolsContext } from '../../../components/scores/annotations/AnnotationTools';

type DrawType = 'circle' | 'rectangle' | 'arrow' | 'text';

type DrawState = {
  type: DrawType;
  startPdfX: number;
  startPdfY: number;
  layerLeft: number;
  layerTop: number;
};

type CirclePreview = {
  type: 'circle';
  x: number;
  y: number;
  radius: number;
};

type ArrowPreview = {
  type: 'arrow';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};
type RectanglePreview = {
  type: 'rectangle';
  x1: number;
  y1: number;
  width: number;
  height: number;
};

type Preview = CirclePreview | RectanglePreview | ArrowPreview;

type UseAnnotationDrawOptions = {
  viewport: PageViewport;
  pageNumber: number;
  onCreate: (annotation: Annotation) => void;
  suppressNextClick: React.RefObject<boolean>;
};

/** ---------------------------------------------------------------
 Starts drawing a new annotation.
 Principle :
 1) You click to draw (handleMouseDownDraw):
    The code runs, we an active drawing tool (circle, rectangle or arrow),
    and We immediately set the trap: suppressNextClick.current = true.
 2) We "drag and drop" (glissé-déposé) to draw the shape,
 3) Then release the mouse (mouseup).
    --> This will by construction !! trigger a Click = The browser generates its
        automatic post-release click:
4) We have to intercept and neutralize the event:


 * @param param0
 * @returns
 */
export function useAnnotationDraw({
  viewport,
  pageNumber,
  onCreate,
  suppressNextClick,
}: UseAnnotationDrawOptions) {
  // Context
  const annotationToolsContext = useContext(AnnotationToolsContext);
  if (!annotationToolsContext) {
    throw new Error(
      'useAnnotationTools must be used within an AnnotationTools provider'
    );
  }
  const { activeTool, strokeWidth, color, fontSize } = annotationToolsContext;

  const drawingRef = useRef<DrawState | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  // Default text value
  const textContent = '';

  /**
   * 1. handleMouseDownDraw (from useAnnotationDraw)
   *
   *
   * @param event
   *
   *
   * @returns
   */
  const handleMouseDownDraw = (event: MouseEvent<HTMLDivElement>) => {
    if (
      (activeTool !== 'circle' &&
        activeTool !== 'rectangle' &&
        activeTool !== 'arrow') ||
      event.button !== 0
    ) {
      return;
    }

    console.log(
      '[useAnnotationDraw] <mousemove> suppressNextClick : ',
      suppressNextClick.current
    );

    event.preventDefault();

    // event.currentTarget
    //    This is the exact DOM element on which the onMouseDown event was triggered
    //    (i.e. the annotation itself – the square or circle that the user clicked on).
    // .parentElement
    //      Moves up one level in the HTML tree to retrieve the annotation’s direct parent.
    //      In the architecture: This parent is the global layer (AnnotationLayer), which covers the entire surface of the PDF page.
    // .getBoundingClientRect()
    //    This is a native browser function. It returns an object containing the exact dimensions and position of an element relative
    //    to the browser’s visible window (the viewport).
    //        left: the distance in pixels between the left edge of the window and the left edge of the PDF layer.
    //        top: the distance between the top of the window and the top of the PDF layer.
    const rect = event.currentTarget.getBoundingClientRect();

    const [startPdfX, startPdfY] = viewport.convertToPdfPoint(
      event.clientX - rect.left,
      event.clientY - rect.top
    );

    drawingRef.current = {
      type: activeTool,
      startPdfX,
      startPdfY,
      layerLeft: rect.left,
      layerTop: rect.top,
    };

    if (activeTool === 'circle') {
      setPreview({
        type: 'circle',
        x: startPdfX,
        y: startPdfY,
        radius: 0,
      });
    } else {
      setPreview({
        type: 'rectangle',
        x1: startPdfX,
        y1: startPdfY,
        width: 0,
        height: 0,
      });
    }
  };

  // Update the preview while the mouse is moving.
  useEffect(() => {
    // This function is triggered at the exact moment the user moves
    // the mouse button
    // The connection is done via window - mousemove
    //    window.removeEventListener('mousemove', handleMouseMove);
    // The Listening is across the entire window in order
    // not to lose track of the drawing.
    const handleMouseMove = (event: globalThis.MouseEvent) => {
      const drawing = drawingRef.current;
      if (!drawing) return;

      suppressNextClick.current = true;

      const viewportX = event.clientX - drawing.layerLeft;
      const viewportY = event.clientY - drawing.layerTop;

      // ---------------------
      // Circle
      // ---------------------
      if (drawing.type === 'circle') {
        // Normalize the circle in viewport coordinates.
        const [pdfX, pdfY] = viewport.convertToPdfPoint(viewportX, viewportY);

        const radius = Math.max(
          5,
          Math.hypot(pdfX - drawing.startPdfX, pdfY - drawing.startPdfY)
        );

        setPreview({
          type: 'circle',
          x: drawing.startPdfX,
          y: drawing.startPdfY,
          radius,
        });

        return;
      }

      // ---------------------
      // Rectangle
      // ---------------------
      if (drawing.type === 'rectangle') {
        // Normalize the rectangle in viewport coordinates.
        const [startX, startY] = viewport.convertToViewportPoint(
          drawing.startPdfX,
          drawing.startPdfY
        );

        setPreview({
          type: 'rectangle',
          x1: Math.min(startX, viewportX),
          y1: Math.min(startY, viewportY),
          width: Math.abs(viewportX - startX),
          height: Math.abs(viewportY - startY),
        });
        return;
      }

      // ---------------------
      // Arrow
      // ---------------------
      if (drawing.type === 'arrow') {
        // Normalize the rectangle in viewport coordinates.
        const [startX, startY] = viewport.convertToViewportPoint(
          drawing.startPdfX,
          drawing.startPdfY
        );

        setPreview({
          type: 'arrow',
          x1: startX,
          y1: startY,
          x2: viewportX, // The end point follows the mouse directly
          y2: viewportY, // The end point follows the mouse directly
        });
        return;
      }
    };

    // This function is triggered at the exact moment the user releases
    // the mouse button to finish drawing their annotation.
    // The connection is done via window - mouseup
    //      window.addEventListener('mouseup', handleMouseUp);
    // The Listening is across the entire window in order
    // not to lose track of the drawing.
    const handleMouseUp = (event: globalThis.MouseEvent) => {
      const drawing = drawingRef.current;
      if (!drawing) return;

      console.log(
        '[useAnnotationDraw] <mouseup> suppressNextClick : ',
        suppressNextClick.current
      );
      suppressNextClick.current = true;
      console.log(
        '[useAnnotationDraw] <mouseup> suppressNextClick : ',
        suppressNextClick.current
      );

      const viewportX = event.clientX - drawing.layerLeft;
      const viewportY = event.clientY - drawing.layerTop;

      const [pdfX, pdfY] = viewport.convertToPdfPoint(viewportX, viewportY);

      let geometry: Annotation['geometry'];

      // ---------------------
      // Circle
      // ---------------------
      if (drawing.type === 'circle') {
        const radius = Math.hypot(
          pdfX - drawing.startPdfX,
          pdfY - drawing.startPdfY
        );

        if (radius <= 2) {
          drawingRef.current = null;
          setPreview(null);
          return;
        }

        geometry = {
          x1: drawing.startPdfX,
          y1: drawing.startPdfY,
          radius,
        };
        // ---------------------
        // Rectangle
        // ---------------------
      } else if (drawing.type === 'rectangle') {
        const [startX, startY] = viewport.convertToViewportPoint(
          drawing.startPdfX,
          drawing.startPdfY
        );

        const left = Math.min(startX, viewportX);
        const top = Math.min(startY, viewportY);
        const width = Math.abs(viewportX - startX);
        const height = Math.abs(viewportY - startY);

        if (width <= 0 || height <= 0) {
          drawingRef.current = null;
          setPreview(null);
          return;
        }

        // Convert the top-left corner back to PDF coordinates.
        const [x, y] = viewport.convertToPdfPoint(left, top);

        geometry = {
          x1: x,
          y1: y,
          width: width / viewport.scale,
          height: height / viewport.scale,
        };
        // ---------------------
        // Arrow
        // ---------------------
      } else if (drawing.type === 'arrow') {
        const length = Math.hypot(
          pdfX - drawing.startPdfX,
          pdfY - drawing.startPdfY
        );

        // Filter to prevent accidental clicks (if the arrow is too small)
        if (length <= 5) {
          drawingRef.current = null;
          setPreview(null);
          return;
        }

        // An arrow just needs its two points as PDF coordinates!
        geometry = {
          x1: drawing.startPdfX,
          y1: drawing.startPdfY,
          x2: pdfX,
          y2: pdfY,
        };
      } else {
        // A fallback in case an unknown type comes along
        drawingRef.current = null;
        setPreview(null);
        return;
      }

      const type = drawing.type;

      drawingRef.current = null;
      setPreview(null);

      onCreate({
        id: getRandomId(),
        page: pageNumber,
        type,
        textContent,
        geometry,
        style: {
          color,
          strokeWidth,
          fontSize,
          opacity: 1,
        },
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [viewport, pageNumber, onCreate, color, strokeWidth, suppressNextClick]);

  return {
    handleMouseDownDraw,
    suppressNextClick,
    preview,
  };
}
