import { useEffect, useState } from 'react';
import { getComposersPage } from '../../services/composers/composersService';
import { logger } from '../../../logger/logger';
import { ComposerPublicResponse } from '../../../../shared/types/composer';

// The business type (ComposerPublicResponse) describes a valid composer
// and does not depend on React's lifecycle.
//
// The hook return contract reflects the asynchronous state of the data:
// `undefined` means the composer has not been loaded yet.
// This is a React state concern, not a business model requirement.
// In fact on the first render, we haven’t yet received the backend composer.
// Your return type must therefore account for this possibility:
//
// `await` cannot be used directly within a React component
// A React component is not asynchronous --> We must use `useEffect()`.

type UseComposersReturn = {
  composers: ComposerPublicResponse[] | undefined;
  totalPages: number;
};

/**
 * Will recover a list of composers depending on some filter
 * @param page : The composers located at 'page'
 * @param sort : "composer asc", "composer desc",..
 * @param onlyMine : The composers (for the logged user) who have a music sheet
 * @param isVerified : The composers who have been validated (verified)
 * @param filter : Some other filters like : Beethoven&searchMode=exact
 * @returns : UseComposersReturn
 */
export function useComposers(
  page: number = 1,
  sort: string,
  onlyMine: boolean = true,
  isVerified: boolean = true,
  filter: string = ''
): UseComposersReturn {
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
        logger.debug(
          'composer',
          `Loading composers ${page} with filter ${filter} `
        );
        const res = await getComposersPage(
          { page, name: filter, isVerified, sort },
          onlyMine
        );

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
  }, [page, onlyMine, isVerified, filter]);
  // The [] symbol means ‘once only during the mounting'.
  return {
    composers,
    totalPages,
  };
}
