import { useEffect, useState } from 'react';
import { getComposer } from '../../services/composers/composersService';
import { logger } from '../../../logger/logger';
import { ComposerPublicResponse } from '../../../../shared/types/composer';

// --------------------------------------------------------
// Routes →       Page       →      Hook      →   Service
// Routes → ComposerEditPage → useGetComposer → getComposer → apiRequest → Backend.
//                                   X
// --------------------------------------------------------

// The business type (ComposerPublicResponse) describes a valid composer
// and does not depend on React's lifecycle.
//
// The hook return contract reflects the asynchronous state of the data:
// `undefined` means the composer has not been loaded yet.
// This is a React state concern, not a business model requirement.
// In fact on the first render, we haven’t yet received the backend composer.
// Your return type must therefore account for this possibility:

type UseComposerReturn = {
  composer: ComposerPublicResponse | undefined;
};

// `await` cannot be used directly within a React component, a React component is not asynchronous
// --> We use `useEffect()`.
export default function useGetComposer(id: number): UseComposerReturn {
  const [composer, setComposer] = useState<ComposerPublicResponse>();

  useEffect(() => {
    async function loadComposer() {
      try {
        const res = await getComposer(id);
        //console.info('Composer', '${res.composer}');
        setComposer(res.composer);
      } catch (error) {
        logger.error('composer', 'Failed loading composer', error);
      }
    }
    loadComposer();
  }, [id]);
  return {
    composer,
  };
}
