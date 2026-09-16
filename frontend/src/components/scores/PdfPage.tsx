import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import AnnotationLayer from './AnnotationLayer';

type Props = {
  page: pdfjsLib.PDFPageProxy;
  width: number;
  onRenderTask: (task: pdfjsLib.RenderTask) => void;
};
/*
PdfPage
   │
   ├── page
   ├── width
   │
   ├── viewport ← React state
   │
   ├── canvas
   │
   └── AnnotationLayer
          ↑
       viewport
*/

export default function PdfPage({ page, width, onRenderTask }: Props) {
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

      <div className="absolute inset-0">
        {viewport && (
          <AnnotationLayer
            viewport={viewport}
            annotation={{
              type: 'circle',
              x: 143.3,
              y: 698.7,
              radius: 20,
            }}
          />
        )}
      </div>
    </div>
  );
}
