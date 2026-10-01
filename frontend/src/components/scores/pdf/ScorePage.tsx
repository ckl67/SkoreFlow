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
  page: pdfjsLib.PDFPageProxy;
  pageNumber: number;
  width: number;
  zoom: number;
  onRenderTask: (task: pdfjsLib.RenderTask) => void;
};

// The purely visual component of a page in the score (Canvas + Annotations).
export default function ScorePage({ page, pageNumber, width, zoom, onRenderTask }: Props) {
  // Complete delegation of the drawing mechanism to the hook
  const { canvasRef, viewport } = useScorePageRenderer({
    page,
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
      <canvas ref={canvasRef} />

      {viewport && <AnnotationEditor viewport={viewport} pageNumber={pageNumber} />}
    </div>
  );
}
