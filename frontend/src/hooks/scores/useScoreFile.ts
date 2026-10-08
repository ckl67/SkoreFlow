import { useEffect, useState } from 'react';
import { logger } from '../../../logger/logger';
import { getScoreThumbnail, getScoreFile } from '../../services/scores/scoresService';

// Remember
// Always pairing:
// URL.createObjectURL(...)
// with:
// URL.revokeObjectURL(...)

export function useScoresThumbnail(id: number) {
  const [fileURL, setFileURL] = useState<string | null>(null);

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

        setFileURL(objectURL);
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

  return { fileURL };
}

export function useScoreFile(id: number) {
  const [fileURL, setFileURL] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Flag to prevent race conditions and memory leaks
    let cancelled = false;
    let createdUrl: string | null = null;

    async function load() {
      // React immediately applies the pending changes (isLoading = true and error = null)
      // and performs the first re-render (to display the spinner, for example).
      setIsLoading(true);
      setError(null);
      setFileURL(null);

      try {
        // ! The server will for example take example, 300 milliseconds to respond.
        // But React will not block and continue on a other place
        const blob = await getScoreFile(id);
        const objectURL = URL.createObjectURL(blob);

        // Avoid creating an ObjectURL that will never be revoked.
        if (cancelled) {
          // If the component was removed whilst the network was loading
          URL.revokeObjectURL(objectURL);
          return;
        }

        createdUrl = objectURL;
        logger.debug('score', '[useScoreFile] Created PDF object URL', objectURL);
        setFileURL(objectURL);
      } catch (error) {
        if (!cancelled) {
          logger.error('score', '[useScoreFile] Failed loading score file', error);
          setError('Unable to load the partition information.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;

      if (createdUrl) {
        logger.debug('score', '[useScoreFile] revoke PDF', createdUrl);
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [id]);

  return { fileURL, isLoading, error };
}
