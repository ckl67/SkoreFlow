// cspell:ignore Turque
import { useEffect, useState } from 'react';
import { getScoresPage } from '../../services/scores/scoresService';
import { logger } from '../../../logger/logger';
import { ScorePublicResponse } from '../../../../shared/types/score';

/* ====================================
Responsibilities are:
- loading a page of scores,
- managing pagination,
- filters,
- sorting,
- refreshing,
- loading,
- and handling errors.
=====================================*/

// `await` cannot be used directly within a React component
// A React component is not asynchronous --> We must use `useEffect()`.
export function useScores(page: number = 1, composer?: string | null) {
  // idem
  //    const [scores, setScores] = useState([
  //    { id: 1, name: 'Marche Turque',.. },
  //    ...
  //    ]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [scores, setScores] = useState<ScorePublicResponse[]>([]);

  useEffect(() => {
    // Flag to prevent race conditions and memory leaks
    // If the request for page 1 takes longer to respond than
    // the one for page 3, page 1 will eventually arrive last
    // and overwrite the result for page 3 in the state!
    let isCancelled = false;

    async function loadScores() {
      try {
        setIsLoading(true);
        setError(null);
        logger.debug('score', `Loading scores for page ${page}..`);
        // React immediately applies the pending changes (isLoading = true and error = null)
        // and performs the first re-render (to display the spinner, for example).

        // ⏸️ PAUSE (Execution pauses here whilst waiting for the server)
        const res = await getScoresPage({
          page: page,
          composer: composer ?? undefined,
        });

        // If the page has changed or the component has
        // been unmounted, the result is ignored
        if (isCancelled) return;

        // The 'await' request has completed; the code continues:
        setScores(res.scores ?? []);
        setTotalPages(res.total_pages ?? 1);
      } catch (err) {
        if (!isCancelled) {
          logger.error('score', 'Failed loading scores', err);
          setError('Unable to load the sheet music.');
        }
      } finally {
        // Second and last re-render
        setIsLoading(false);
      }
    }

    loadScores();

    // Clean-up function executed if 'page' changes
    // or if the component is unmounted
    return () => {
      isCancelled = true;
    };
  }, [page, composer]);
  return {
    scores,
    isLoading,
    error,
    totalPages,
  };
}
