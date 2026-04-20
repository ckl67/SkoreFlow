import js from "@eslint/js";

export default [
  js.configs.recommended, // Active les règles de base (dont no-undef)
  {
    rules: {
      "no-undef": "error", // Interdit l'usage de variables non définies 💥
      "no-unused-vars": "warn", // Alerte si tu déclares une variable sans l'utiliser
      "no-console": "off", // Autorise console.log (utile pour tes tests)
    },
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        module: "readonly",
        require: "readonly",
      },
    },
  },
];
