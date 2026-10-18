import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

type UseScorePageRendererOptions = {
  pdfPage: pdfjsLib.PDFPageProxy;
  width: number;
  zoom: number;
  onRenderTask: (task: pdfjsLib.RenderTask) => void;
};

/**
 * Custom hook that acts as the application’s graphics engine.
 * It acts as a bridge between the raw object provided by PDF.js and the HTML5 <canvas> element interface.
 * handling scaling, viewport calculations, asynchronous rendering, and cancellation cleanup.
 *
 * @param options - The hook options object.
 * @param options.pdfPage - The PDFPageProxy object representing the page to render.
 * @param options.width - The available width of the container.
 * @param options.zoom - The current zoom scaling factor.
 * @param options.onRenderTask - Callback to register the active render task for cleanup management.
 * @returns An object containing the `canvasRef` reference and the calculated `viewport`.
 */
export function useScorePageRenderer({
  pdfPage,
  width,
  zoom,
  onRenderTask,
}: UseScorePageRendererOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewport, setViewport] = useState<pdfjsLib.PageViewport | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width) return;

    // PDF.js handles pages as vectors. `initialViewport` retrieves the ‘raw’ size (at scale 1) of the PDF page.
    const initialViewport = pdfPage.getViewport({ scale: 1 });

    // (at scale 1) of the PDF page. We calculate the ratio between the available width
    // in your container (width) and the base width of the PDF, and then multiply this by your zoom factor
    const scale = (width / initialViewport.width) * zoom;

    // A `nextViewport` is created; this is the reference object containing the exact dimensions, in pixels,
    // that the canvas and the page must adopt.
    const nextViewport = pdfPage.getViewport({ scale });

    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = nextViewport.width;
    canvas.height = nextViewport.height;

    setViewport(nextViewport);

    // This is where PDF.js ‘draws’ the musical score onto the canvas’s 2D context.
    // This is an asynchronous operation.
    const renderTask = pdfPage.render({
      canvasContext: context,
      canvas,
      viewport: nextViewport,
    });

    // ➡️ Intercepting PDF.js’s own cancellation
    renderTask.promise.catch((error: any) => {
      if (error?.name === 'RenderingCancelledException') {
        // This is a normal cancellation (quick change or StrictMode), so we ignore it
        return;
      }
      console.error('Error whilst rendering the PDF:', error);
    });

    // 1. We store the task in the parent’s Set
    onRenderTask(renderTask);

    // 2. The useEffect cleanup function
    return () => {
      renderTask.cancel();
    };
  }, [pdfPage, width, zoom, onRenderTask]);

  return { canvasRef, viewport };
}
