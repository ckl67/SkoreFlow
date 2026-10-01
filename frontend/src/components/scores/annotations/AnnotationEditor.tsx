import { useAnnotations } from '../../../hooks/scores/annotations/useAnnotations';
import type { PageViewport } from 'pdfjs-dist';
import AnnotationLayer from '../annotations/AnnotationLayer';

type Props = {
  viewport: PageViewport;
  pageNumber: number;
};

export default function AnnotationEditor({ viewport, pageNumber }: Props) {
  const { annotations, selectedId, create, select, remove } = useAnnotations();

  return (
    <AnnotationLayer
      viewport={viewport}
      pageNumber={pageNumber}
      annotations={annotations}
      selectedAnnotationId={selectedId}
      onCreate={create}
      onSelect={select}
    />
  );
}
