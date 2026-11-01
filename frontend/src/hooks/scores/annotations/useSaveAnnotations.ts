import { useCallback, useEffect, useRef, useState } from 'react';

import type { Annotation } from '../../../../../shared/types/score';
import { UpdateScoreAnnotations } from '../../../services/scores/scoresService';

// ==============================================================
// The difference between useEffect and useCallback
// Although both of these hooks accept an array of dependencies,
// their roles are fundamentally opposite:
// useEffect
//    Synchronize the component with an external system
//    (API, event listeners, DOM, etc.).
//    Runs automatically after React has rendered the screen,
//    whenever a dependency changes.
// useCallback
//    Optimize the performance by caching a function between renderings.
//    Does not run automatically.
//    The function is simply recalculated or cached only if one
//    of its dependencies changes.
// ==============================================================

// latestAnnotations provides access to the most recent list at the moment the save operation begins.
// savingRef prevents two save requests from being sent simultaneously, even before the next React render.
// lastSavedSnapshot is only updated after a positive response from the backend.

type Props = {
  scoreId: number;
  annotations: Annotation[];
};

/**
 * useSaveAnnotations Behavior
 * 1. The user creates, moves or deletes an annotation.
 * 2. The one-second timer starts.
 * 3. If another change occurs, the timer resets to zero.
 * 4. When the timer expires, the save operation begins.
 * 5. If a change occurs whilst a save is in progress, it must also be saved.
 * @param param0
 * @returns
 */
export function useSaveAnnotations({ scoreId, annotations }: Props) {
  //Component states for UI feedback
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // A version counter used to re-trigger the autosave effect after a save completes
  const [saveVersion, setSaveVersion] = useState(0);

  // References to keep track of state across renders without causing extra re-renders
  const lastSavedSnapshot = useRef(JSON.stringify(annotations));

  // Store the latest annotations in a ref to avoid stale closure issues inside async functions
  const latestAnnotations = useRef(annotations);
  latestAnnotations.current = annotations;

  // Synchronous lock to prevent multiple concurrent save requests
  const savingRef = useRef(false);

  // Compute current data snapshot and dirty status
  const currentSnapshot = JSON.stringify(annotations);
  const isDirty = currentSnapshot !== lastSavedSnapshot.current;

  // Memoized save function to handle API communication
  const saveAnnotations = useCallback(async () => {
    // Prevent overlapping save calls if a request is already in progress
    if (savingRef.current) return;

    // Take a snapshot of the most up-to-date annotations
    const snapshot = JSON.stringify(latestAnnotations.current);

    // Skip saving if nothing has changed since the last save
    if (snapshot === lastSavedSnapshot.current) return;

    // Lock the saving state
    savingRef.current = true;
    setIsSaving(true);
    setSaveStatus(null);

    try {
      // Parse the snapshot string back into an Annotation array for the API payload
      const annotationsToSave = JSON.parse(snapshot) as Annotation[];

      const response = await UpdateScoreAnnotations({
        scoreId,
        annotations: annotationsToSave,
      });

      // Update the last saved reference and success status message
      lastSavedSnapshot.current = snapshot;
      setSaveStatus(response.message ?? 'Annotations saved successfully.');
    } catch (error) {
      // Handle any request errors gracefully
      const message =
        error instanceof Error ? error.message : 'Unable to save annotations.';

      setSaveStatus(`Save failed: ${message}`);
    } finally {
      // Release the lock and reset saving indicators
      savingRef.current = false;
      setIsSaving(false);

      // Trigger another check after the request completes (e.g. if changes happened during the save)
      setSaveVersion((version) => version + 1);
    }
  }, [scoreId]);

  // Automatically trigger an autosave 1 second after the last modification (debounce effect)
  useEffect(() => {
    // Do nothing if there are no unsaved changes
    if (!isDirty) return;

    // Set a timer to execute the save function after 1000ms of inactivity
    const timeoutId = setTimeout(() => {
      void saveAnnotations();
    }, 1000);

    // Cleanup function: clears the timeout if annotations change before 1s or if the component unmounts
    return () => clearTimeout(timeoutId);
  }, [currentSnapshot, isDirty, isSaving, saveVersion, saveAnnotations]);

  // Return handlers and status values for component usage
  return {
    saveAnnotations,
    isSaving,
    saveStatus,
    isDirty,
  };
}
