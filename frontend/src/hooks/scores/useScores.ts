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
export function useScores() {
  // idem
  //    const [scores, setScores] = useState([
  //    { id: 1, name: 'Marche Turque',.. },
  //    ...
  //    ]);
  const [scores, setScores] = useState<ScorePublicResponse[]>([]);

  useEffect(() => {
    async function loadScores() {
      try {
        logger.debug('score', 'Loading scores .. (Page 1 only)');
        const res = await getScoresPage();
        setScores(res.scores ?? []);
      } catch (error) {
        logger.error('score', 'Failed loading scores', error);
      }
    }

    loadScores();
  }, []);
  // The [] symbol means ‘once only during the mounting'.
  return {
    scores,
  };
}
