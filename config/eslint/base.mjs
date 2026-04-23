import js from "@eslint/js";

export default [
  js.configs.recommended,

  {
    rules: {
      "no-undef": "error",
      "no-unused-vars": "warn",
      "no-console": "off",
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
