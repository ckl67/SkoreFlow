import { useEffect, useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

export function usePdfLoader(fileURL: string) {
  // A PDFPageProxy object represents an individual page of a PDF document
  // extracted using PDF.js.
  // It does not directly contain an HTML image, but provides methods
  // for interacting with that page:
  //  page.getViewport({ scale: 1.0 }):
  //      calculates the size and dimensions of the page.
  //  page.render({ canvasContext, viewport }):
  //    renders the page onto an HTML `<canvas>` element.
  //  page.getTextContent():
  //    extracts the plain text from the page for searching or selection.

  // TypeScript Generics: indicates that this property will contain
  // an array ([]) of objects of type PDFPageProxy
  // (provided by the PDF.js library).
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
