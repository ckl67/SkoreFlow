import { logger } from '../../../logger/logger';
import { config } from '../../config/config';

export default function MainPage() {
  logger.debug('router', 'MainPage()');
  return <div>Hello</div>;
}
