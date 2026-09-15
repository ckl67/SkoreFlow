import { useEffect, useState } from 'react';
import { logger } from '../../../logger/logger';
import { getScoreThumbnail } from '../../services/scores/scoresService';

// Remember
// Always pairing:
// URL.createObjectURL(...)
// with:
// URL.revokeObjectURL(...)

export function useScoresThumbnail(id: number) {
  const [url, setURL] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectURL: string | null = null;

    async function load() {
      try {
        //logger.debug('score', 'Loading Thumbnail for Score', id);

        logger.debug('score', '(getScoreThumbnail) BEFORE request', id);
        const blob = await getScoreThumbnail(id);
        logger.debug('score', '(getScoreThumbnail) AFTER request', id);

        objectURL = URL.createObjectURL(blob);

        // To avoid to create an ObjectURL that will never be revoked.
        if (cancelled) {
          return;
        }

        logger.debug('score', 'Created object URL', objectURL);

        setURL(objectURL);
      } catch (error) {
        logger.error('score', 'Failed loading thumbnail', error);
      }
    }

    load();

    return () => {
      cancelled = true;

      if (objectURL) {
        logger.debug('score', 'revoke', objectURL);

        URL.revokeObjectURL(objectURL);
      }
    };
  }, [id]);

  return url;
}
