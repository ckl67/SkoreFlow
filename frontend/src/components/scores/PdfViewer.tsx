import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type Props = {
  fileURL: string;
};

//PdfViewer
//    ScoreViewer
//        ↓
//    useScoreFile()
//        ↓
//    PDF Blob → ObjectURL
//        ↓
//    PdfViewer
//        ↓
//    PDF.js
//        ↓
//    canvas page 1
//    canvas page 2
//    canvas page 3
//       ...
//
// ------------------------
//    useEffect #1
//    ResizeObserver
//         ↓
//    containerWidth
//
//    useEffect #2
//    fileURL + containerWidth
//        ↓
//      PDF.js
//        ↓
//    render pages

export default function PdfViewer({ fileURL }: Props) {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const [pageCount, setPageCount] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;

      if (width) {
        setContainerWidth(width);
      }
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      try {
        const pdf = await pdfjsLib.getDocument(fileURL).promise;

        if (cancelled) {
          return;
        }

        setPageCount(pdf.numPages);

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
          const page = await pdf.getPage(pageNumber);

          if (cancelled) {
            return;
          }

          const canvas = canvasRefs.current[pageNumber - 1];

          if (!canvas) {
            continue;
          }

          // Compute the scale
          const initialViewport = page.getViewport({ scale: 1 });
          const scale = containerWidth / initialViewport.width;
          const viewport = page.getViewport({ scale });

          const context = canvas.getContext('2d');

          if (!context) {
            continue;
          }

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({
            canvasContext: context,
            viewport,
          }).promise;
        }
      } catch (error) {
        console.error('Failed to render PDF', error);
      }
    }

    loadPdf();

    return () => {
      cancelled = true;
    };
  }, [fileURL, containerWidth]);

  // We will create n <canvas>:
  return (
    <div ref={containerRef} className="flex flex-col items-center gap-6">
      {Array.from({ length: pageCount }, (_, index) => (
        <canvas
          key={index}
          ref={(canvas) => {
            canvasRefs.current[index] = canvas;
          }}
        />
      ))}
    </div>
  );
}
