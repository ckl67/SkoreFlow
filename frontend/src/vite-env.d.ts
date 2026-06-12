/// <reference types="vite/client" />
// Means : In This project use Vite --> In other words : Connect TypeScript to Vite
//    In config file : tsconfig.json
//      "types": ["vite/client"] == import './style.css'; & import.meta.env.VITE_API_URL;
// Without the "file vite-env.d.ts", TypeScript would not understand :  import.meta.env.VITE_API_URL;
