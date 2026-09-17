import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

import AnnotationLayer from './AnnotationLayer';
import type { Annotation } from '../../../../shared/types/score';

type Props = {
  page: pdfjsLib.PDFPageProxy;
  pageNumber: number;
  width: number;
  annotations: Annotation[];
  onCreateAnnotation: (annotation: Annotation) => void;
  onRenderTask: (task: pdfjsLib.RenderTask) => void;
  selectedAnnotationId: string | null;
  onSelectAnnotation: (id: string) => void;
};

/*
PdfPage
 ├── canvas PDF.js
 ├── viewport
 └── annotations[]
        ↓
   AnnotationLayer
        ↓
     display
*/

export default function PdfPage({
  page,
  pageNumber,
  width,
  annotations,
  selectedAnnotationId,
  onCreateAnnotation,
  onSelectAnnotation,
  onRenderTask,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [viewport, setViewport] = useState<pdfjsLib.PageViewport | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !width) {
      return;
    }

    const initialViewport = page.getViewport({ scale: 1 });

    const scale = width / initialViewport.width;

    const nextViewport = page.getViewport({ scale });

    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    canvas.width = nextViewport.width;
    canvas.height = nextViewport.height;

    setViewport(nextViewport);

    const renderTask = page.render({
      canvasContext: context,
      canvas,
      viewport: nextViewport,
    });

    onRenderTask(renderTask);

    return () => {
      renderTask.cancel();
    };
  }, [page, width, onRenderTask]);

  return (
    <div
      className="relative"
      style={{
        width: viewport?.width,
        height: viewport?.height,
      }}
    >
      <canvas ref={canvasRef} />

      {viewport && (
        <AnnotationLayer
          viewport={viewport}
          pageNumber={pageNumber}
          annotations={annotations.filter((annotation) => annotation.page === pageNumber)}
          selectedAnnotationId={selectedAnnotationId}
          onCreate={onCreateAnnotation}
          onSelect={onSelectAnnotation}
        />
      )}
    </div>
  );
}
