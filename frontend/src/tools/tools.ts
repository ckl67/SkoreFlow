//Standard import (uses crypto where available)
import { useEffect, useState } from 'react';
import { nanoid } from 'nanoid';

// Unsafe import (ideal for HTTP / older browsers)
import { nanoid as nonSecureNanoid } from 'nanoid/non-secure';

// identifiers (21 characters), which take up less memory and are very easy to configure with an HTTP fallback.
// const id = getRandomId();
// Example : "V1StGXR8_Z5jdHi6B-myT"
export function getRandomId() {
  try {
    return nanoid();
  } catch (e) {
    return nonSecureNanoid();
  }
}

// You type “B”, then “e”, then “e” at 80 ms intervals:
// with each keystroke, the return () => clearTimeout(timer)
// cancels the current timer and starts a new one for 300 ms.
// As soon as you pause for 300 ms, the timer runs out:
// `debouncedValue` will be send
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
