import { useEffect, useState } from 'react';
import { getComposersPage } from '../../services/composers/composersService';
import { logger } from '../../../logger/logger';
import { ComposerPublicResponse } from '../../../../shared/types/composer';

/* ====================================
Responsibilities are:
- loading a page of composers,
- managing pagination,
- filters,
- sorting,
- refreshing,
- loading,
- and handling errors.
=====================================*/

type UseComposersReturn = {
  composers: ComposerPublicResponse[];
  totalPages: number;
};

// `await` cannot be used directly within a React component
// A React component is not asynchronous --> We must use `useEffect()`.
export function useComposers(page: number = 1): UseComposersReturn {
  // idem
  //    const [composers, setComposers] = useState([
  //    { id: 1, uname: 'Beethoven',.. },
  //    ...
  //    ]);

  const [composers, setComposers] = useState<ComposerPublicResponse[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  useEffect(() => {
    async function loadComposers() {
      try {
        logger.debug('composer', `Loading composers ${page}.`);
        const res = await getComposersPage({ page });

        // If total_rows is 0, an empty slice is forced to prevent inconsistencies in the back end
        if (res.total_rows === 0) {
          setComposers([]);
          setTotalPages(0);
        } else {
          setComposers(res.composers ?? []);
          setTotalPages(res.total_pages);
        }

        logger.debug(
          'composer',
          'Total Pages rows',
          res.total_pages,
          res.total_rows
        );
      } catch (error) {
        logger.error('composer', 'Failed loading composers', error);
      }
    }

    loadComposers();
  }, [page]);
  // The [] symbol means ‘once only during the mounting'.
  return {
    composers,
    totalPages,
  };
}
