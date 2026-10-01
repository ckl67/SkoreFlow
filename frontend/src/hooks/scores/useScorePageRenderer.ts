import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

type UseScorePageRendererOptions = {
  page: pdfjsLib.PDFPageProxy;
  width: number;
  zoom: number;
  onRenderTask: (task: pdfjsLib.RenderTask) => void;
};

export function useScorePageRenderer({ page, width, zoom, onRenderTask }: UseScorePageRendererOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewport, setViewport] = useState<pdfjsLib.PageViewport | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width) return;

    const initialViewport = page.getViewport({ scale: 1 });
    const scale = (width / initialViewport.width) * zoom;
    const nextViewport = page.getViewport({ scale });

    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = nextViewport.width;
    canvas.height = nextViewport.height;

    setViewport(nextViewport);

    const renderTask = page.render({
      canvasContext: context,
      canvas,
      viewport: nextViewport,
    });

    // 1. We store the task in the parent’s Set
    onRenderTask(renderTask);

    // 2. The useEffect cleanup function
    return () => {
      renderTask.cancel();
    };
  }, [page, width, zoom, onRenderTask]);

  return { canvasRef, viewport };
}
