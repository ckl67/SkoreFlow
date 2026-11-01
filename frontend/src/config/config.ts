// Consult deployment-guide.md
// import.meta.env.VITE_XXX is always a string
// Environment variables: VITE_API_URL, VITE_TEST_MODE, etc.
// If VITE_API_URL is omitted, '/api/v1' is used as a fallback.
// Since '/api/v1' starts with a slash (/), it is a relative URL.
// The browser automatically appends it to the current domain (e.g., https://skoreflow.fr/api/v1).
export const config = {
  apiUrl: import.meta.env.VITE_API_URL ?? '/api/v1',
  testMode: import.meta.env.VITE_TEST_MODE === 'true',
} as const;
