import base from "../../config/eslint/base.mjs";

export default [
  ...base,
  {
   rules: {
      // To avoid conflict with prettier logique only 
      "no-undef": "error",
      "no-unused-vars": "warn",
      "no-console": "off"     
  },
];
