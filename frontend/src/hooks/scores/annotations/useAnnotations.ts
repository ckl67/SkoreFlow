import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Annotation } from '../../../../../shared/types/score';

/**
 * Manages annotation interactions for the current PDF page.
 * The complete annotation list is owned by the parent component.
 * Principle
 *  You create an annotation on page 1: it is added to the full list.
 *  You go to page 2: the annotation from page 1 remains in memory, but is not displayed.
 *  You return to page 1: the annotation is still there.
 * You delete an annotation: it is removed from the full list and does not reappear when you change pages.
 */
export function useAnnotations(
  pageNumber: number,
  allAnnotations: Annotation[],
  setAllAnnotations: Dispatch<SetStateAction<Annotation[]>>
) {
  // Stores the ID of the currently selected annotation.
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Only expose annotations belonging to the current page.
  const annotations = allAnnotations.filter(
    (annotation) => annotation.page === pageNumber
  );

  /**
   * Adds a new annotation to the complete document annotation list.
   */
  const create = (annotation: Annotation) => {
    setAllAnnotations((current) => [...current, annotation]);
  };

  /**
   * Selects an annotation by its ID.
   */
  const select = (id: string | null) => {
    setSelectedId(id);
  };

  /**
   * Removes an annotation from the complete document annotation list.
   */
  const remove = (id: string) => {
    setAllAnnotations((current) =>
      current.filter((annotation) => annotation.id !== id)
    );

    setSelectedId(null);
  };

  /**
   * Updates the geometry of an annotation without modifying other properties.
   */
  const updateGeometry = (id: string, newGeometry: Annotation['geometry']) => {
    setAllAnnotations((current) =>
      current.map((annotation) =>
        annotation.id === id
          ? { ...annotation, geometry: newGeometry }
          : annotation
      )
    );
  };

  return {
    annotations,
    selectedId,
    create,
    select,
    remove,
    updateGeometry,
  };
}
