import { useEffect, useRef, useState } from 'react';

//import * as pdfjsLib from 'pdfjs-dist';
//import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

import ScorePage from './ScorePage';

import { useContainerWidth } from '../../../hooks/scores/useContainerWidth';
import { usePdfLoader } from '../../../hooks/scores/pdf/usePdfLoader';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type Props = {
  fileURL: string;
};

// The global component that manages the container, the zoom toolbar and the list of pages in the score.
export default function ScoreViewer({ fileURL }: Props) {
  // An <div> tag is represented in memory by an object of the HTMLDivElement class.
  // containerRef is a pointer.
  // Initially, it is empty (null), but later it will point exclusively to a DOM object of type HTMLDivElement.
  // Thanks to the prop ref={containerRef}, React stores the reference in containerRef
  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useContainerWidth(containerRef);
  const { pages, renderTasks } = usePdfLoader(fileURL);

  const [zoom, setZoom] = useState(1);

  const zoomOut = () => {
    setZoom((current) => Math.max(0.5, current - 0.25));
  };

  const zoomIn = () => {
    setZoom((current) => Math.min(5, current + 0.25));
  };

  const resetZoom = () => {
    setZoom(1);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-center gap-2">
        <button type="button" onClick={zoomOut} className="rounded border px-3 py-1">
          −
        </button>

        <button type="button" onClick={resetZoom} className="min-w-16 rounded border px-3 py-1">
          {Math.round(zoom * 100)} %
        </button>

        <button type="button" onClick={zoomIn} className="rounded border px-3 py-1">
          +
        </button>
      </div>

      <div ref={containerRef} className="flex flex-col items-center gap-6">
        {pages.map((page) => (
          <ScorePage
            key={page.pageNumber}
            page={page}
            pageNumber={page.pageNumber}
            width={containerWidth}
            zoom={zoom}
            // ScoreViewer passes a function to each ScorePage.
            // The instruction is: “As soon as you trigger a PDF page rendering,
            // give me the reference for that task so that I can add it to the renderTasks register”.
            onRenderTask={(task) => renderTasks.current.add(task)}
          />
        ))}
      </div>
    </div>
  );
}
