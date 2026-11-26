// cspell:words supertramp
import axios from 'axios';
import { useEffect, useState } from 'react';
import { logger } from '../../../logger/logger';
import {
  getComposerPicture,
  getComposerThumbnail,
} from '../../services/composers/composersService';

// Remember
// Always pairing:
// URL.createObjectURL(...)
// with:
// URL.revokeObjectURL(...)

export function useComposersPicture(
  id: number,
  enabled: boolean
): string | null {
  const [url, setURL] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectURL: string | null = null;

    setURL(null);

    // No request is necessary when the composer has no picture.
    if (!enabled) {
      return;
    }

    async function load() {
      try {
        //logger.debug('composer', '(getComposerPicture) BEFORE request', id);
        const blob = await getComposerPicture(id);
        //const blob = await getComposerThumbnail(id);

        // To avoid to create an ObjectURL that will never be revoked.
        // The effect may have been cleaned up while the request was pending.
        if (cancelled) {
          return;
        }

        // logger.debug('composer', '(getComposerPicture) AFTER request', id);
        objectURL = URL.createObjectURL(blob);

        logger.debug('composer', 'Created object URL', objectURL);
        setURL(objectURL);
      } catch (error) {
        if (cancelled) return;

        // In case the picture is not found
        // example rename :
        // /composers/supertramp/picture to
        // /composers/supertramp/picture_modified
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          logger.debug('composer', 'Picture not found', id);
          return;
        }

        logger.error('composer', 'Failed loading picture', error);
      }
    }

    load();

    return () => {
      cancelled = true;

      if (objectURL) {
        logger.debug('composer', 'revoke', objectURL);

        URL.revokeObjectURL(objectURL);
      }
    };
  }, [id]);

  return url;
}
