import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

import PdfPage from './PdfPage';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type Props = {
  fileURL: string;
};

/* PdfViewer
│
├── loads the PDF
├── loads the PDFPageProxy
├── monitors the width
│
├── PdfPage 1
│   ├── PDF.js canvas
│   └── React annotation layer
│
├── PdfPage 2
│   ├── PDF.js canvas
│   └── React annotation layer
│
└── PdfPage 3
    ├── PDF.js canvas
    └── React annotation layer
 */
export default function PdfViewer({ fileURL }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTasks = useRef<Set<pdfjsLib.RenderTask>>(new Set());

  const [pages, setPages] = useState<pdfjsLib.PDFPageProxy[]>([]);
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
    let document: pdfjsLib.PDFDocumentProxy | null = null;

    async function loadPdf() {
      try {
        document = await pdfjsLib.getDocument(fileURL).promise;

        if (cancelled) {
          await document.destroy();
          return;
        }

        const loadedPages: pdfjsLib.PDFPageProxy[] = [];

        for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
          const page = await document.getPage(pageNumber);

          if (cancelled) {
            return;
          }

          loadedPages.push(page);
        }

        setPages(loadedPages);
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load PDF', error);
        }
      }
    }

    setPages([]);
    loadPdf();

    return () => {
      cancelled = true;

      for (const task of renderTasks.current) {
        task.cancel();
      }

      renderTasks.current.clear();

      if (document) {
        document.destroy();
      }
    };
  }, [fileURL]);

  const handleRenderTask = (task: pdfjsLib.RenderTask) => {
    renderTasks.current.add(task);

    task.promise
      .catch((error) => {
        if (!(error instanceof pdfjsLib.RenderingCancelledException)) {
          console.error('Failed to render PDF page', error);
        }
      })
      .finally(() => {
        renderTasks.current.delete(task);
      });
  };

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-6">
      {pages.map((page) => (
        <PdfPage key={page.pageNumber} page={page} width={containerWidth} onRenderTask={handleRenderTask} />
      ))}
    </div>
  );
}
