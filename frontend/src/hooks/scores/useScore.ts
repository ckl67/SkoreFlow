import { useEffect, useState } from 'react';
import { logger } from '../../../logger/logger';
import { getScore } from '../../services/scores/scoresService';
import { ScorePublicResponse } from '../../../../shared/types/score';

// Remember
/**
 * Return the score information : ScorePublicResponse
 * @param id
 * @returns : score, isLoading, error
 */
export function useScore(id: number) {
  const [score, setScore] = useState<ScorePublicResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    async function load() {
      try {
        // React immediately applies the pending changes (isLoading = true and error = null)
        // and performs the first re-render (to display the spinner, for example).
        setIsLoading(true);
        setError(null);

        // ! The server will for example take example, 300 milliseconds to respond.
        // But React will not block and continue on a other place
        const res = await getScore(id);

        // Once res got a answer
        // We will update the state ONLY if the component is still mounted
        if (!cancelled) {
          // This will render with the new score
          // "Hey React! The asynchronous request that ran for 300 ms has just finished!
          // Here’s the result, res.
          // Add it to the score state and trigger a new re-render so that
          // the screen finally displays the sheet music!"
          if (res && res.score) {
            setScore(res.score); // We only extract the 'score' property
          } else {
            // Error handling if the response is invalid or incomplete
            // Reset the score to null if the attempt fails
            setScore(null);
            setError('Invalid score payload received from server');
          }
        }
      } catch (error) {
        if (!cancelled) {
          logger.error(
            'score',
            '[useScore] Failed to load scoreId:',
            id,
            'err:',
            error
          );
          // Reset the score to null if the attempt fails
          setScore(null);
          setError('Unable to load the partition information.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    // Clean-up function: executed if the ID changes or if the component is unmounted
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { score, isLoading, error };
}
