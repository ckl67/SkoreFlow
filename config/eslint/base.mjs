// ============================================================
// ESLint Flat Configuration (ESLint v9+)
// ============================================================
//
// This configuration is designed for a TypeScript monorepo
// using modern tooling (ESM + tsx runtime).
//
// Key characteristics:
// - Supports JavaScript + TypeScript
// - Uses ESLint "flat config" format (no .eslintrc)
// - Integrates @typescript-eslint for full TS awareness
// - Compatible with tsx (runtime execution tool)
// ============================================================

import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  // ============================================================
  // 1. GLOBAL IGNORES
  // ============================================================
  // These paths are completely ignored by ESLint.
  // They are excluded from parsing, linting, and rule evaluation.
  {
    ignores: [
      '**/node_modules/**', // third-party dependencies
      '**/venv/**', // optional Python environments (if present in monorepo)
      '**/dist/**', // build output (compiled JS)
      '**/build/**', // alternative build output folder
    ],
  },

  // ============================================================
  // 2. BASE JAVASCRIPT RULES
  // ============================================================
  // ESLint's official recommended rules for JavaScript.
  // Provides baseline static analysis (best practices, error detection).
  //
  // Example rules included:
  // - no-undef
  // - no-unused-vars (JS version)
  // - possible syntax/runtime issues
  js.configs.recommended,

  // ============================================================
  // 3. TYPESCRIPT SUPPORT LAYER
  // ============================================================
  // This enables full TypeScript parsing and linting support.
  //
  // It replaces / overrides JS parsing behavior for .ts files:
  // - understands interfaces, types, generics
  // - avoids false positives from JS-only rules
  // - enables TypeScript-aware rule replacements
  //
  // IMPORTANT:
  // This is REQUIRED for proper `.ts` support in ESLint v9 flat config.
  ...tseslint.configs.recommended,

  // ============================================================
  // 4. PROJECT-SPECIFIC RULE OVERRIDES
  // ============================================================
  // These rules override or refine default behavior.
  // This is where project-specific lint decisions are made.
  {
    rules: {
      // --------------------------------------------------------
      // Console usage policy
      // --------------------------------------------------------
      // In this project, console logs are allowed (useful for tests,
      // debugging, and backend scripts executed via tsx).
      'no-console': 'off',

      // --------------------------------------------------------
      // TypeScript-specific unused variables handling
      // --------------------------------------------------------
      // Replaces ESLint's JS version of `no-unused-vars`
      // because TS understands types, interfaces, and generics.
      //
      // This avoids false positives like:
      // - unused type-only imports
      // - interface declarations
      '@typescript-eslint/no-unused-vars': 'warn',

      // --------------------------------------------------------
      // no-undef
      // --------------------------------------------------------
      // Disabled because TypeScript already performs
      // full symbol resolution and type checking.
      //
      // Keeping it enabled would create duplicate or false errors.
      'no-undef': 'off',
    },
  },
];
