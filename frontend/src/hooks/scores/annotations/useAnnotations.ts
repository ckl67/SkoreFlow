import { useEffect, useState } from 'react';
import type { Annotation } from '../../../../../shared/types/score';

export function useAnnotations() {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const create = (annotation: Annotation) => {
    setAnnotations((current) => [...current, annotation]);
  };

  const select = (id: string) => {
    setSelectedId(id);
  };

  const remove = (id: string) => {
    setAnnotations((current) => current.filter((annotation) => annotation.id !== id));

    setSelectedId(null);
  };

  return {
    annotations,
    selectedId,
    create,
    select,
    remove,
  };
}
