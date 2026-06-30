// Consult  deployment-guide.md
// import.meta.env.VITE_XXX is always a string
export const config = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api',
  testMode: import.meta.env.VITE_TEST_MODE === 'true',
} as const;
