import { useCallback, useRef, useState } from 'react';

//import * as pdfjsLib from 'pdfjs-dist';
//import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

import ScoreViewerItem from './ScoreViewerItem';

import { useContainerWidth } from '../../../hooks/scores/useContainerWidth';
import { usePdfLoader } from '../../../hooks/scores/pdf/usePdfLoader';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type Props = {
  fileURL: string;
};

const SINGLE_PAGE = true;

// The global component that manages the container, the zoom toolbar and the list of pages in the score.
export default function ScoreViewer({ fileURL }: Props) {
  // An <div> tag is represented in memory by an object of the HTMLDivElement class.
  // containerRef is a pointer.
  // Initially, it is empty (null), but later it will point exclusively to a DOM object of type HTMLDivElement.
  // Thanks to the prop ref={containerRef}, React stores the reference in containerRef
  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useContainerWidth(containerRef);
  const { pages, renderTasks } = usePdfLoader(fileURL);

  const onRenderTask = useCallback((task: pdfjsLib.RenderTask) => {
    renderTasks.current.add(task);
  }, []);

  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // 1. New status for vertical offset
  const [scrollOffset, setScrollOffset] = useState(0);

  // Fixed height of the display window
  // (e.g. 200px to show 1 or 2 staves)
  const CLIP_HEIGHT = 200;
  // No vertical jump with every click (e.g. 150px)
  const STEP_HEIGHT = 150;

  const zoomOut = () => {
    setZoom((current) => Math.max(0.5, current - 0.25));
  };

  const zoomIn = () => {
    setZoom((current) => Math.min(5, current + 0.25));
  };

  const resetZoom = () => {
    setZoom(1);
  };

  // 2. Vertical step navigation
  const stepNext = () => {
    setScrollOffset((prev) => prev + STEP_HEIGHT);
  };

  const stepPrevious = () => {
    setScrollOffset((prev) => Math.max(0, prev - STEP_HEIGHT));
  };

  // 3. Global page navigation (resets the offset)
  const previousPage = () => {
    setCurrentPage((current) => Math.max(1, current - 1));
  };

  const nextPage = () => {
    setCurrentPage((current) => Math.min(pages.length, current + 1));
  };

  const page = pages[currentPage - 1];

  return (
    <div className="flex h-full flex-col justify-between">
      {/* Zoom toolbar */}
      {/* 1. BARRE DU HAUT : ZOOM (Fixe) */}
      <div className="mb-2 flex shrink-0 items-center justify-center gap-2">
        <button
          type="button"
          onClick={zoomOut}
          className="rounded border px-3 py-1"
        >
          −
        </button>
        <button
          type="button"
          onClick={resetZoom}
          className="min-w-16 rounded border px-3 py-1"
        >
          {Math.round(zoom * 100)} %
        </button>
        <button
          type="button"
          onClick={zoomIn}
          className="rounded border px-3 py-1"
        >
          +
        </button>
      </div>

      {/* Main container */}
      <div
        ref={containerRef}
        className="flex flex-col items-center gap-6"
      >
        {page && (
          <ScoreViewerItem
            key={page.pageNumber}
            page={page}
            pageNumber={page.pageNumber}
            width={containerWidth}
            zoom={zoom}
            onRenderTask={onRenderTask}
            scrollOffset={scrollOffset} // <-- On transmet le décalage
          />
        )}
      </div>

      {/* Navigation bar with tabs / pages */}
      <div className="mb-4 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={previousPage}
          disabled={currentPage === 1}
          className="rounded border bg-gray-100 px-3 py-1 text-xs disabled:opacity-50"
          //className="rounded border px-3 py-1"
        >
          ◀
        </button>

        <button
          type="button"
          onClick={stepPrevious}
          disabled={scrollOffset === 0}
          className="rounded border bg-blue-500 px-3 py-1 text-white hover:bg-blue-600 disabled:opacity-50"
        >
          ▲ Monter
        </button>

        <span className="text-sm font-medium">
          Page {currentPage} / {pages.length} (Offset: {scrollOffset}px)
        </span>

        <button
          type="button"
          onClick={stepNext}
          className="rounded border bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
        >
          ▼ Descendre
        </button>

        <span>
          Page {currentPage} / {pages.length}
        </span>

        <button
          type="button"
          onClick={nextPage}
          disabled={currentPage === pages.length}
          className="rounded border px-3 py-1"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
