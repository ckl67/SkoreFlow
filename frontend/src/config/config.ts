// Consult  deployment-guide.md
// import.meta.env.VITE_XXX is always a string
// If forget to set VITE_API_URL,
// the application will continue to work correctly behind Nginx, which is the standard production architecture.
export const config = {
  apiUrl: import.meta.env.VITE_API_URL ?? '/api',
  testMode: import.meta.env.VITE_TEST_MODE === 'true',
} as const;
