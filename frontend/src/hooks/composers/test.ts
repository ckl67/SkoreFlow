import { useEffect, useState } from 'react';
import { getComposer } from '../../services/composers/composersService';
import { logger } from '../../../logger/logger';
import type { ComposerPublicResponse } from '../../../../shared/types/composer';

type UseComposerReturn = {
  composer: ComposerPublicResponse | undefined;
};

export function useGetComposer(id: number): UseComposerReturn {
  const [composer, setComposer] = useState<ComposerPublicResponse>();

  useEffect(() => {
    async function loadComposer() {
      try {
        const res = await getComposer(id);
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
