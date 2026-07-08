/// <reference types="vite/client" />
// The [3x slash / ] above are mandatory and are used exclusively with TypeScript.
// Without it:
// import.meta.env
// would result in:
// Property 'env' does not exist
// Also we have to use here Interface
//  See document doc/general/type-vs-interface.md

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_TEST_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
