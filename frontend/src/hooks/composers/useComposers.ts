import { useEffect, useState } from 'react';
import { getComposersPage } from '../../services/composers/composerService';
import { logger } from '../../core/logger/logger';
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

// `await` cannot be used directly within a React component
// A React component is not asynchronous --> We must use `useEffect()`.
export function useComposers() {
  // idem
  //    const [composers, setComposers] = useState([
  //    { id: 1, uname: 'Beethoven',.. },
  //    ...
  //    ]);
  const [composers, setComposers] = useState<ComposerPublicResponse[]>([]);

  useEffect(() => {
    async function loadComposers() {
      try {
        logger.debug('composer', 'Loading composers (Page 1 only)');
        const res = await getComposersPage();
        setComposers(res.composers ?? []);
      } catch (error) {
        logger.error('composer', 'Failed loading composers', error);
      }
    }

    loadComposers();
  }, []);
  // The [] symbol means ‘once only during the mounting'.
  return {
    composers,
  };
}
