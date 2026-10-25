import type { PageViewport } from 'pdfjs-dist';
import type { Dispatch, SetStateAction } from 'react';
import { useAnnotations } from '../../../hooks/scores/annotations/useAnnotations';
import AnnotationLayer from '../annotations/AnnotationLayer';
import AnnotationTools from './AnnotationTools';
import { Annotation } from '../../../../../shared/types/score';

type Props = {
  allAnnotations: Annotation[];
  setAllAnnotations: Dispatch<SetStateAction<Annotation[]>>;
  viewport: PageViewport;
  pageNumber: number;
};

/**
 * AnnotationEditor is responsible for displaying and managing the editor for annotations.
 *
 * @param props - The component properties.
 * @param props.viewport - The score to be displayed in PDFJS format.
 * @param props.pageNumber - The page number of the score.
 * @returns The rendered AnnotationEditor component.
 */
export default function AnnotationEditor({
  allAnnotations,
  setAllAnnotations,
  viewport,
  pageNumber,
}: Props) {
  // ----------------
  // useAnnotations
  // ----------------
  const { annotations, selectedId, create, select, remove, updateGeometry } =
    useAnnotations(pageNumber, allAnnotations, setAllAnnotations);

  // console.log('annotation', annotations)
  return (
    <AnnotationTools>
      <AnnotationLayer
        viewport={viewport}
        pageNumber={pageNumber}
        annotations={annotations}
        selectedAnnotationId={selectedId}
        onCreate={create}
        onSelect={select}
        onDelete={remove}
        onUpdateGeometry={updateGeometry}
      />
    </AnnotationTools>
  );
}
