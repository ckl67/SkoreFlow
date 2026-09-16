import { useEffect, useState } from 'react';
import { logger } from '../../../logger/logger';
import { getScoreThumbnail, getScoreFile } from '../../services/scores/scoresService';

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
        logger.debug('score', '(getScoreThumbnail) BEFORE request', id);

        const blob = await getScoreThumbnail(id);

        logger.debug('score', '(getScoreThumbnail) AFTER request', id);

        objectURL = URL.createObjectURL(blob);

        if (cancelled) {
          URL.revokeObjectURL(objectURL);
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

export function useScoreFile(id: number) {
  const [url, setURL] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectURL: string | null = null;

    async function load() {
      try {
        logger.debug('score', '(getScoreFile) BEFORE request', id);

        const blob = await getScoreFile(id);

        logger.debug('score', '(getScoreFile) AFTER request', id);

        objectURL = URL.createObjectURL(blob);

        // Avoid creating an ObjectURL that will never be revoked.
        if (cancelled) {
          URL.revokeObjectURL(objectURL);
          return;
        }

        logger.debug('score', 'Created PDF object URL', objectURL);

        setURL(objectURL);
      } catch (error) {
        logger.error('score', 'Failed loading score file', error);
      }
    }

    load();

    return () => {
      cancelled = true;

      if (objectURL) {
        logger.debug('score', 'revoke PDF', objectURL);
        URL.revokeObjectURL(objectURL);
      }
    };
  }, [id]);

  return url;
}
