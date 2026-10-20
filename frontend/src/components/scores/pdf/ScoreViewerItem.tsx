// -------------------------------------------------------
// As workaround to Firefox 140
// issue : Map.prototype.getOrInsertComputed === undefined
//   pdfjs-dist 5.7.284
//        │
//        └── legacy/build
//                │
//                ├── Firefox 140 ✅
//                └── Opera ✅
// import * as pdfjsLib from 'pdfjs-dist';
// becomes
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
// -------------------------------------------------------
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

import AnnotationEditor from '../annotations/AnnotationEditor';
import { useScorePageRenderer } from '../../../hooks/scores/useScorePageRenderer';

type Props = {
  pdfPage: pdfjsLib.PDFPageProxy;
  pageNumber: number;
  width: number;
  zoom: number;
  onRenderTask: (task: pdfjsLib.RenderTask) => void;
};

// .

/**
 * ScoreViewerItem renders an individual page of a PDF score onto an HTML5 canvas
 * and manages its corresponding interactive annotation layer.
 * Visual component of a page of score (Canvas + Annotations)
 *
 * @param props - The component properties.
 * @param props.pdfPage - The PDFPageProxy object representing the PDF page from PDF.js.
 * @param props.pageNumber - The page number of the score.
 * @param props.width - The target width available for the page container.
 * @param props.zoom - The current zoom scaling factor applied to the score.
 * @param props.onRenderTask - Callback function to register the active PDF.js render task
 * @returns The rendered ScoreViewerItem component.
 */
export function ScoreViewerItem({
  pdfPage,
  pageNumber,
  width,
  zoom,
  onRenderTask,
}: Props) {
  // ...

  // This hook is the application’s graphics engine.
  // It acts as a bridge between the raw object provided by PDF.js and the HTML5 <canvas> element interface.
  const { canvasRef, viewport } = useScorePageRenderer({
    pdfPage,
    width,
    zoom,
    onRenderTask,
  });

  return (
    <div
      className="relative mx-auto shrink-0"
      style={{
        width: viewport?.width,
        height: viewport?.height,
      }}
    >
      {/* Here we displays the pdf score */}
      <canvas ref={canvasRef} />

      {/* AnnotationEditor is responsible for displaying and managing the editor for annotations */}
      {viewport && (
        <AnnotationEditor
          viewport={viewport}
          pageNumber={pageNumber}
        />
      )}
    </div>
  );
}
