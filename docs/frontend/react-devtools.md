# React DevTools

## Introduction

The easiest way to debug websites built with React is to install the React Developer Tools browser extension.
It is available for several popular browsers: [see](https://react.dev/learn/react-developer-tools)

It adds two tabs to your DevTools:

- Components:
  - Allows you to inspect the React component tree of your page, and to view and modify their props and state in real time.
- Profiler:
  - Allows you to measure your application’s performance and understand why a component is re-rendering.

## What is a Source Map?

A Source Map is a translation file.

When you’re developing in React, you write clean, well-spaced code using JSX and modern TypeScript.
But to ensure the site loads quickly, your tool (Vite) transforms this code:

- it bundles everything together,
- removes spaces,
- renames your variables using unique letters (a, b, c) and
- translates the JSX into standard JavaScript.

This is known as `minification` and `compilation`.

If your code crashes in the browser, the console will tell you:

- “Error on line 1, column 43512 of index.js”.
  This is unreadable and impossible to debug.

The Source Map (.map) tells the browser:

- “Line 1, column 43512 of the minified code actually corresponds to line 12 of your MyComponent.jsx file”.

## Issue

Sometimes, Your local development server `(Vite, running on http://localhost:5173)` receives a request for these .map files.
As it does not have them, it usually returns an HTML error page (or a 404 page).
DevTools then attempts to parse this HTML response as if it were JSON **_(the format used for Source Maps)_**, which fails immediately at line 1, column 1 (because the HTML begins with `< rather than {)`.
Example :

- installHook.js and
- react_devtools_backend_compact.js
  are scripts injected by the React extension

## Fixing

The issue is not coming from Vite, or React, or SkoreFlow code, it was indeed Firefox DevTools trying to resolve the source maps injected by React Developer Tools.

The setting that made the error disappear is:

Debugger
☐ Map source code \ `Cartographie le code source`

By disabling this option, Firefox no longer attempts to load:

```shell
installHook.js.map
react_devtools_backend_compact.js.map
```

What this actually changes
The automatic mapping between the compiled JavaScript and the original source code in the Firefox debugger.

For example, with source maps enabled, Firefox may display:

```shell
bundle.js line 15230
       ↓
src/components/LoginPage.tsx line 45
```

With source maps disabled:

```shell
bundle.js line 15230
```

But the impact is very minor.

### Recommendation

In Devtools section : Debugger

<!-- cspell:disable -->

☑ Ignore known third-party scripts / `Ignorer les scripts tiers connus`
☑ Hide ignored sources / `masquer les sources ignorées`
☑ Automatic line breaks /`Retour à la ligne automatique`

☐ Disable JavaScript / `Désactiver javascript`
☐ Map source code / `cartographie le code source`
☐ Inline variable preview (depending on preference) / `Aperçu de variable en ligne`

<!-- cspell:enable -->
