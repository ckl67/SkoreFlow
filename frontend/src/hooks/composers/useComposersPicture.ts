import { useEffect, useState } from 'react';
import { logger } from '../../../logger/logger';
import { getComposerPicture } from '../../services/composers/composersService';

// Remember
// Always pairing:
// URL.createObjectURL(...)
// with:
// URL.revokeObjectURL(...)

export function useComposersPicture(id: number) {
  const [url, setURL] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectURL: string | null = null;

    setURL(null);
    async function load() {
      try {
        //logger.debug('composer', '(getComposerPicture) BEFORE request', id);
        const blob = await getComposerPicture(id);

        // To avoid to create an ObjectURL that will never be revoked.
        // The effect may have been cleaned up while the request was pending.
        if (cancelled) {
          return;
        }

        // logger.debug('composer', '(getComposerPicture) AFTER request', id);
        objectURL = URL.createObjectURL(blob);

        //logger.debug('composer', 'Created object URL', objectURL);
        setURL(objectURL);
      } catch (error) {
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
