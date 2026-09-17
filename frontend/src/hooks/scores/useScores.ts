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
export function useScores(page: number = 1) {
  // idem
  //    const [scores, setScores] = useState([
  //    { id: 1, name: 'Marche Turque',.. },
  //    ...
  //    ]);
  const [scores, setScores] = useState<ScorePublicResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    async function loadScores() {
      try {
        setIsLoading(true);
        setError(null);
        logger.debug('score', `Loading scores for page ${page}..`);

        const res = await getScoresPage({ page });
        setScores(res.scores ?? []);
        setTotalPages(res.total_pages ?? 1);
      } catch (err) {
        logger.error('score', 'Failed loading scores', err);
        setError('Unable to load the sheet music.');
      } finally {
        setIsLoading(false);
      }
    }

    loadScores();
  }, [page]);
  // By passing an empty array [], you’re telling React: ‘Run this effect just once, immediately after the component is first mounted.’
  // Triggers a re-fetch as soon as 'page' changes
  return {
    scores,
    isLoading,
    error,
    totalPages,
  };
}
