import { useEffect, useRef, useState } from 'react';

import type { MouseEvent } from 'react';
import type { PageViewport } from 'pdfjs-dist';
import type { Annotation } from '../../../../../shared/types/score';

type DragState = {
  id: string;
  startPdfX: number;
  startPdfY: number;
  initialGeometry: Annotation['geometry'];
  layerLeft: number;
  layerTop: number;
  mode:
    'move' | 'resize-start' | 'resize-end' | 'resize-radius' | 'resize-rect-br';
};

type Props = {
  viewport: PageViewport;
  onSelect: (id: string) => void;
  onUpdateGeometry: (id: string, newGeometry: Annotation['geometry']) => void;
};

/**
 *
 * @param param0
 * @returns
 */
export function useAnnotationDrag({
  viewport,
  onSelect,
  onUpdateGeometry,
}: Props) {
  // 'drag' preserves the initial position and geometry of the annotation.
  // This allows each displacement to be calculated from the starting position,
  // rather than accumulating displacement errors.
  const [drag, setDrag] = useState<DragState | null>(null);
  const suppressNextClick = useRef(false);

  /**
   * Handles the start of a mouse interaction on an annotation.
   * handleMouseDownDrag was originally written for divs (HTMLDivElement);
   * it refuses to accept an event from an SVG element (SVGLineElement).
   * To fix :  <-- Changed from HTMLDivElement to Element
   *
   * @param event - The mouse event triggered by the user.
   * @param annotation - The annotation being interacted with.
   */
  const handleMouseDownDrag = (
    event: MouseEvent<Element>,
    annotation: Annotation
  ) => {
    if (event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    // Get the position of the annotation layer relative to the viewport.
    // event.currentTarget
    //    Is the exact DOM element on which the onMouseDown event was triggered
    //    (i.e. the annotation itself, the square or circle that the user clicked on).
    // .parentElement
    //    We go up one level in the HTML tree to retrieve the direct parent of the annotation.
    //    This parent is the global layer (AnnotationLayer), which covers the entire surface of the PDF page.
    //  .getBoundingClientRect()
    //    This is a native browser function.
    //    It returns an object containing the exact dimensions and position of an element relative to the browser’s visible window (the viewport).
    const layerRect =
      event.currentTarget.parentElement?.getBoundingClientRect();

    // console.log('[useAnnotationDrag]', layerRect?.left, layerRect?.top);
    if (!layerRect) return;

    const [startPdfX, startPdfY] = viewport.convertToPdfPoint(
      event.clientX - layerRect.left,
      event.clientY - layerRect.top
    );

    // By default, we are in global movement mode
    let mode:
      | 'move'
      | 'resize-start'
      | 'resize-end'
      | 'resize-radius'
      | 'resize-rect-br' = 'move';

    // 0 Rectangle management
    if (annotation.type === 'rectangle') {
      // In the PDF coordinate system, the point (0,0) is at the bottom left of the page.
      const geom = annotation.geometry;
      const x1 = geom.x1 ?? 0;
      const y1 = geom.y1 ?? 0;
      const width = geom.width ?? 0;
      const height = geom.height ?? 0;

      // Coordinates of the bottom-right corner in PDF
      const x2 = x1 + width;
      const y2 = y1 - height;

      // Conversion to screen pixels to compare with the click position
      const [x2Screen, y2Screen] = viewport.convertToViewportPoint(x2, y2);
      const clickScreenX = event.clientX - layerRect.left;
      const clickScreenY = event.clientY - layerRect.top;

      const distToBottomRight = Math.hypot(
        clickScreenX - x2Screen,
        clickScreenY - y2Screen
      );
      const threshold = 15; // Capture tolerance around the corner

      // If you click near the bottom-right corner -> Resize
      if (distToBottomRight < threshold) {
        mode = 'resize-rect-br';
      } else {
        // Otherwise -> Global translation of the rectangle
        mode = 'move';
      }
    }
    // 1 Arrow Management
    else if (annotation.type === 'arrow') {
      const geom = annotation.geometry;
      if (
        geom.x1 !== undefined &&
        geom.y1 !== undefined &&
        geom.x2 !== undefined &&
        geom.y2 !== undefined
      ) {
        // Convert PDF coordinates to screen pixels to compare distances in pixels (more intuitive)
        const [x1Screen, y1Screen] = viewport.convertToViewportPoint(
          geom.x1,
          geom.y1
        );
        const [x2Screen, y2Screen] = viewport.convertToViewportPoint(
          geom.x2,
          geom.y2
        );

        const clickScreenX = event.clientX - layerRect.left;
        const clickScreenY = event.clientY - layerRect.top;

        //console.log('(', clickScreenX, 'x', clickScreenY);

        const distToStart = Math.hypot(
          clickScreenX - x1Screen,
          clickScreenY - y1Screen
        );
        const distToEnd = Math.hypot(
          clickScreenX - x2Screen,
          clickScreenY - y2Screen
        );

        const threshold = 15; // 15-pixel tolerance around the edges

        if (distToEnd < threshold) {
          mode = 'resize-end'; // We grab the tip
        } else if (distToStart < threshold) {
          mode = 'resize-start'; // We’ll take the base
        }
      }
    }
    // 2. Circle management
    else if (annotation.type === 'circle') {
      const geom = annotation.geometry;
      // Retrieve the centre and radius (adjust the property names to match your model)
      const cx = geom.x1 ?? 0;
      const cy = geom.y1 ?? 0;
      const radius = geom.radius ?? 0;

      const [cxScreen, cyScreen] = viewport.convertToViewportPoint(cx, cy);
      const clickScreenX = event.clientX - layerRect.left;
      const clickScreenY = event.clientY - layerRect.top;

      // Distance between the click and the centre of the circle (in screen pixels)
      const distFromCenter = Math.hypot(
        clickScreenX - cxScreen,
        clickScreenY - cyScreen
      );
      const radiusScreen = radius * viewport.scale;

      const threshold = 12; // Capture tolerance in pixels around the circle

      // If the distance to the centre is close to the radius,
      // we treat it as the edge -> Resize the radius
      if (Math.abs(distFromCenter - radiusScreen) < threshold) {
        mode = 'resize-radius';
      }
      // Otherwise (if we are inside or at the centre), we move the whole circle
      else {
        mode = 'move';
      }
    }

    // onSelect event handler manages focus
    // (which object is currently active in the application).
    onSelect(annotation.id);

    setDrag({
      id: annotation.id,
      startPdfX,
      startPdfY,
      initialGeometry: annotation.geometry,
      layerLeft: layerRect.left,
      layerTop: layerRect.top,
      mode,
    });
  };

  // Update the annotation position while the mouse is moving.
  useEffect(() => {
    if (!drag) return;

    //console.log('drag.mode :', drag.mode);
    const handleMouseMove = (event: globalThis.MouseEvent) => {
      const [pdfX, pdfY] = viewport.convertToPdfPoint(
        event.clientX - drag.layerLeft,
        event.clientY - drag.layerTop
      );

      const dx = pdfX - drag.startPdfX;
      const dy = pdfY - drag.startPdfY;

      let newGeometry = { ...drag.initialGeometry };

      if (drag.mode === 'resize-rect-br') {
        // The top-left corner (x1, y1) remains fixed.
        // The new width/height is the distance between this corner and the current mouse position.
        const x1 = drag.initialGeometry.x1 ?? 0;
        const y1 = drag.initialGeometry.y1 ?? 0;

        const newWidth = pdfX - x1;
        const newHeight = y1 - pdfY;

        newGeometry = {
          ...drag.initialGeometry,
          // We ensure that the size is at least a minimum value (e.g. 10 pixels in PDF) to avoid negative or zero widths
          width: Math.max(10, newWidth),
          height: Math.max(10, newHeight),
        };
      } else if (drag.mode === 'resize-radius') {
        // The centre remains fixed; the new radius is the distance between the centre and the mouse (in PDF coordinates)
        const cx = drag.initialGeometry.x1 ?? 0;
        const cy = drag.initialGeometry.y1 ?? 0;

        const newRadius = Math.hypot(pdfX - cx, pdfY - cy);

        newGeometry = {
          ...drag.initialGeometry,
          radius: Math.max(5, newRadius), // Avoid a radius of zero or a negative value (minimum 5 pixels in PDF)
        };
      } else if (
        drag.mode === 'resize-end' &&
        'x2' in newGeometry &&
        'y2' in newGeometry
      ) {
        // Resizing the arrowhead
        newGeometry.x2 = (drag.initialGeometry.x2 ?? 0) + dx;
        newGeometry.y2 = (drag.initialGeometry.y2 ?? 0) + dy;
      } else if (
        drag.mode === 'resize-start' &&
        'x1' in newGeometry &&
        'y1' in newGeometry
      ) {
        // Resizing the base of the arrow
        newGeometry.x1 = drag.initialGeometry.x1 + dx;
        newGeometry.y1 = drag.initialGeometry.y1 + dy;
      } else {
        // Global translation
        newGeometry.x1 = drag.initialGeometry.x1 + dx;
        newGeometry.y1 = drag.initialGeometry.y1 + dy;
        if ('x2' in newGeometry && newGeometry.x2 !== undefined) {
          newGeometry.x2 = newGeometry.x2 + dx;
        }
        if ('y2' in newGeometry && newGeometry.y2 !== undefined) {
          newGeometry.y2 = newGeometry.y2 + dy;
        }
      }

      onUpdateGeometry(drag.id, newGeometry);

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

  return {
    handleMouseDownDrag,
    suppressNextClick,
  };
}
