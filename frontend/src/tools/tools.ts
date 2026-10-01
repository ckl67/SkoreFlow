//Standard import (uses crypto where available)
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
