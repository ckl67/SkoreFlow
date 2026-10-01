import { useEffect, useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

export function usePdfLoader(fileURL: string) {
  const [pages, setPages] = useState<pdfjsLib.PDFPageProxy[]>([]);

  // renderTasks
  // useRef: Allows you to keep a set of tasks in memory without triggering a React re-render
  // every time a task is added or removed.
  // Set: A JavaScript collection of unique elements, ideal for adding (.add()) or removing (.delete())
  // active tasks.
  const renderTasks = useRef<Set<pdfjsLib.RenderTask>>(new Set());

  useEffect(() => {
    let cancelled = false;
    let document: pdfjsLib.PDFDocumentProxy | null = null;

    async function loadPdf() {
      try {
        document = await pdfjsLib.getDocument(fileURL).promise;
        if (cancelled) return document.destroy();

        const loadedPages = [];
        for (let i = 1; i <= document.numPages; i++) {
          const page = await document.getPage(i);
          if (cancelled) return;
          loadedPages.push(page);
        }
        setPages(loadedPages);
      } catch (err) {
        if (!cancelled) console.error(err);
      }
    }

    setPages([]);
    loadPdf();

    return () => {
      cancelled = true;
      // When the user leaves the sheet music page:
      renderTasks.current.forEach((t) => t.cancel());
      renderTasks.current.clear();
      if (document) document.destroy();
    };
  }, [fileURL]);

  return { pages, renderTasks };
}
