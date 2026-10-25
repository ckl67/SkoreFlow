import { useCallback, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

import { ScoreViewerItem } from './ScoreViewerItem';
import { useContainerWidth } from '../../../hooks/scores/useContainerWidth';
import { usePdfLoader } from '../../../hooks/scores/pdf/usePdfLoader';
import { ScorePublicResponse } from '../../../../../shared/types/score';

// a single list containing all the annotations in the document, regardless of the page they appear on.
import type { Annotation } from '../../../../../shared/types/score';
import { UpdateScoreAnnotations } from '../../../services/scores/scoresService';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type Props = {
  score: ScorePublicResponse;
  fileURL: string;
};

/**
 * ScoreViewer manages the main interface logic for displaying a score,
 * including zoom controls, pagination (+/-) between PDF pages, container width observation,
 * and the rendering of the active score page item.
 *
 * @param props - The component properties.
 * @param props.fileURL - The URL of the PDF file to be loaded and rendered.
 * @returns The rendered ScoreViewer component layout containing top zoom bar, central score canvas, and bottom navigation.
 */
export default function ScoreViewer({ score, fileURL }: Props) {
  // a single list containing all the annotations in the the PDF !
  const [allAnnotations, setAllAnnotations] = useState<Annotation[]>(
    score.annotations
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useContainerWidth(containerRef);
  const { pdfPages, renderTasks } = usePdfLoader(fileURL);

  const onRenderTask = useCallback((task: pdfjsLib.RenderTask) => {
    renderTasks.current.add(task);
  }, []);

  // Pages
  const [currentPage, setCurrentPage] = useState(1);
  const previousPage = () => {
    setCurrentPage((current) => Math.max(1, current - 1));
  };
  const nextPage = () => {
    setCurrentPage((current) => Math.min(pdfPages.length, current + 1));
  };
  const currentPdfPage = pdfPages[currentPage - 1];

  // Zoom
  const [zoom, setZoom] = useState(1);
  const zoomOut = () => setZoom((current) => Math.max(0.5, current - 0.25));
  const zoomIn = () => setZoom((current) => Math.min(5, current + 0.25));
  const resetZoom = () => setZoom(1);

  // SAVE
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAnnotations = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const response = await UpdateScoreAnnotations({
        scoreId: score.id,
        annotations: allAnnotations,
      });

      setSaveStatus(response.message ?? 'Annotations saved successfully.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to save annotations.';

      setSaveStatus(`Save failed: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col justify-between ">
      {/* ------------------------ */}
      {/* 1. TOP BAR: ZOOM (Fixed) */}
      {/* ------------------------ */}
      <div className="flex shrink-0 items-center justify-center gap-3 border-b  border-gray-200 pb-2 ">
        <button
          type="button"
          onClick={zoomOut}
          className="rounded border px-3 py-1  hover:bg-gray-400 shadow-md transition  hover:shadow-xl"
        >
          −
        </button>
        <button
          type="button"
          onClick={resetZoom}
          className="min-w-16 rounded border px-3 py-1 hover:bg-gray-400 shadow-md transition  hover:shadow-xl"
        >
          {Math.round(zoom * 100)} %
        </button>{' '}
        <button
          type="button"
          onClick={zoomIn}
          className="rounded border px-3 py-1 hover:bg-gray-400 shadow-md transition  hover:shadow-xl"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleSaveAnnotations}
          disabled={isSaving}
          className="rounded border px-3 py-1 shadow-md hover:bg-gray-400 disabled:opacity-50"
        >
          {isSaving ? 'Saving…' : 'Save annotations'}
        </button>
        {saveStatus && (
          <p
            role="status"
            className="text-center text-sm"
          >
            {saveStatus}
          </p>
        )}
      </div>

      {/* ----------------------------------------------------- */}
      {/* 2. CENTRAL AREA: PARTITION (The only scrollable area) */}
      {/* ----------------------------------------------------- */}
      <div
        // Reference to compute the width
        className="flex flex-1 min-h-0 overflow-auto "
        ref={containerRef}
      >
        {currentPdfPage && (
          <ScoreViewerItem
            key={currentPdfPage.pageNumber}
            score={score}
            allAnnotations={allAnnotations}
            setAllAnnotations={setAllAnnotations}
            pdfPage={currentPdfPage}
            pageNumber={currentPdfPage.pageNumber}
            width={containerWidth}
            zoom={zoom}
            onRenderTask={onRenderTask}
          />
        )}
      </div>

      {/* ----------------------------------------------------- */}
      {/* 3. BARRE DU BAS : NAVIGATION (Fixe) */}
      {/* ----------------------------------------------------- */}
      <div className="mt-2 flex shrink-0 items-center justify-center gap-3 border-t border-gray-200 pt-3">
        <button
          type="button"
          onClick={previousPage}
          disabled={currentPage === 1}
          className="rounded border border-gray-500  px-3 py-1 disabled:opacity-50 shadow-md transition  hover:shadow-xl hover:bg-blue-200"
        >
          ◀
        </button>
        <span className="text-sm font-medium">
          Page {currentPage} / {pdfPages.length}
        </span>
        <button
          type="button"
          onClick={nextPage}
          disabled={currentPage === pdfPages.length}
          className="rounded border border-gray-500  px-3 py-1 disabled:opacity-50 shadow-md transition  hover:shadow-xl  hover:bg-blue-200"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
