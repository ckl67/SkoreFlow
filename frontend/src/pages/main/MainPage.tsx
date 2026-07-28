import { logger } from '../../../logger/logger';
import { config } from '../../config/config';

export default function MainPage() {
  return (
    <div>
      Hello
      <img src={`${config.apiUrl}/composers/2/picture`} alt="Composer demo" />
    </div>
  );
}
