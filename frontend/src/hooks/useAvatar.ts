import { useEffect, useState } from 'react';
import { getAvatar, getUserAvatar } from '../services/avatarService';
import { logger } from './../core/logger/logger';

// Remember
// Always pairing:
// URL.createObjectURL(...)
// with:
// URL.revokeObjectURL(...)

export function useAvatar(userId?: number) {
  logger.debug('avatar', 'Before rendering', userId);
  // render
  const [url, setURL] = useState<string | null>(null);

  useEffect(() => {
    let objectURL: string | null = null;

    async function load() {
      logger.debug('avatar', 'Loading avatar for user', userId);

      const blob = await getAvatar();

      objectURL = URL.createObjectURL(blob);
      logger.debug('avatar', 'Created object URL', objectURL);

      setURL(objectURL);
    }

    // setURL
    load();

    return () => {
      if (objectURL) {
        logger.debug('avatar', 'revoke', objectURL);
        URL.revokeObjectURL(objectURL);
      }
    };
  }, [userId]);

  return url;
}
