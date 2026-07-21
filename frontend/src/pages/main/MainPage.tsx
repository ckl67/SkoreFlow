import { logger } from '../../core/logger/logger';

export default function MainPage() {
  logger.debug('router', 'MainPage()');
  return <div>Main Page</div>;
}
