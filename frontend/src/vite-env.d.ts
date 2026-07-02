/// <reference types="vite/client" />
// This reference keep the (3x/) is mandatory and is used exclusively with TypeScript.
// Without it:
// import.meta.env
// would result in:
// Property 'env' does not exist

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_TEST_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
