import { useEffect, useState } from 'react';
import { logger } from '../../core/logger/logger';
import { getComposerPicture } from '../../services/composers/composerService';

// Remember
// Always pairing:
// URL.createObjectURL(...)
// with:
// URL.revokeObjectURL(...)

export function useComposersPicture(id: number) {
  const [url, setURL] = useState<string | null>(null);

  useEffect(() => {
    logger.debug('composer', 'Rendering (useComposersPicture) Loading Picture for Composer', id);
    let objectURL: string | null = null;

    async function load() {
      logger.debug('composer', 'Loading Picture for Composer', id);

      const blob = await getComposerPicture(id);

      objectURL = URL.createObjectURL(blob);
      logger.debug('composer', 'Created object URL', objectURL);

      setURL(objectURL);
      return;
    }

    // setURL
    load();

    return () => {
      if (objectURL) {
        logger.debug('composer', 'revoke', objectURL);
        URL.revokeObjectURL(objectURL);
      }
    };
  }, [id]);

  return url;
}
