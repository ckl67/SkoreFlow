import { useContext } from 'react';
import { DevContext } from './DevProvider';

export function useDev() {
  const context = useContext(DevContext);

  if (!context) {
    throw new Error('useDev must be used inside DevProvider');
  }

  return context;
}
