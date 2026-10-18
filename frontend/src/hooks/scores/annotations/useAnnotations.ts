import { useEffect, useState } from 'react';
import type { Annotation } from '../../../../../shared/types/score';

/**
 * Custom hook that manages the state and business logic for score annotations,
 * including the list of annotations,
 * the currently (only one) reference of the selected annotation ID,
 * and providing safe manipulation actions (create, select, remove).
 *
 * @returns An object containing the `annotations` array, `selectedId`, and manipulation functions (`create`, `select`, `remove`).
 */
export function useAnnotations() {
  // annotations (an array of objects):
  // Stores all the geometric shapes or text drawn on the score (circles, rectangles, etc.).
  // By default, it is empty ([]).
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  // selectedId (a string or null):
  // This stores the ID of the annotation currently selected by the user
  // (which allows, for example, it to be highlighted with a thicker border
  // or a delete menu to be displayed).
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Action Functions (CRUD)

  // In React (setAnnotations) are asynchronous.
  // If the user clicks several times in quick succession,
  // • Without a callback (setAnnotations([...annotations, annotation])) :
  //  If the state has changed in the meantime, we risk overwriting data or missing updates.
  // • With a callback ((current) => ...): React guarantees that the `current` variable
  // contains the most recent and up-to-date state possible
  const create = (annotation: Annotation) => {
    setAnnotations((current) => [...current, annotation]);
  };

  const select = (id: string) => {
    setSelectedId(id);
  };

  const remove = (id: string) => {
    setAnnotations((current) =>
      current.filter((annotation) => annotation.id !== id)
    );

    setSelectedId(null);
  };

  const updateGeometry = (id: string, newGeometry: Annotation['geometry']) => {
    setAnnotations((current) =>
      current.map((ann) =>
        ann.id === id ? { ...ann, geometry: newGeometry } : ann
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
