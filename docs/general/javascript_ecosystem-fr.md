# 1. JS / TS Ecosystem — Guide mental complet (Node, TS, modules, tooling)

Les 3 couches fondamentales

## 1.1. Le langage (JavaScript / TypeScript)

JavaScript
Langage exécuté par le runtime (Node / navigateur)
Dynamique, non typé
Syntaxe :

```javascript
function add(a, b) {
  return a + b;
}
```

TypeScript
Superset de JavaScript
Ajoute des types au moment du développement uniquement
Ne s’exécute jamais directement

```typescript
function add(a: number, b: number): number {
  return a + b;
}
```

👉 Important :

TS est supprimé (transpilé) avant exécution

## 1.2. Le runtime (Node.js / Browser)

Node.js

- Exécute JavaScript
- N’exécute PAS TypeScript nativement (sauf outils comme tsx)

Browser

- Exécute JS uniquement
- nécessite bundler (Vite/Webpack)

## 1.3. Le rôle du “transpiler”

TypeScript doit être transformé :

→ JavaScript

Outils :

- tsc (compilateur officiel)
- tsx (runtime direct dev)
- vite (frontend bundler)

# 2. Le système de modules

C’est ici que tout devient compliqué.

## 2.1. CommonJS (ancien Node)

```javascript
const fs = require('fs');

module.exports = { read };
```

Caractéristiques

- Node historique
- synchrone
- require :module.exports

👉 encore très utilisé dans legacy

## 2.2. ES Modules (ESM moderne)

```typescript
import fs from 'fs';

export function read() {}
```

Caractéristiques

- standard JavaScript officiel
- async-friendly
- utilisé par browser + Node moderne

⚠️ problème réel

Node doit décider : 👉 “ce fichier est CommonJS ou ESM ?”

## 2.3. moduleResolution (TypeScript)

Rôle dire à TypeScript : “comment trouver les imports ?”

### 2.3.1. Les modes importants

🟡 Node (ancien)
moduleResolution: "Node"
modèle historique
compatible CommonJS + ESM hybride
simple
utilisé avec tsx souvent

🔵 Node16
moduleResolution: "Node16"
respecte Node.js moderne
distingue CJS / ESM via package.json
impose discipline stricte

🔴 NodeNext
moduleResolution: "NodeNext"
version stricte de Node16
simule exactement Node ESM moderne
impose .js dans imports TS
très contraignant

🟢 Bundler (Vite / frontend)
moduleResolution: "Bundler"
ne simule pas Node
laisse le bundler résoudre
utilisé en frontend moderne 6.

## 2.4. module (TypeScript)

👉 dit : “quel JS je génère”

option sortie

- CommonJS require/module.exports
- ESNext import/export
- Node16 hybride Node
- NodeNext ESM strict Node 7. ⚡ tsx (ton cas important)

👉 tsx fait :

- compile TS à la volée
- exécute directement
- ignore une partie des contraintes strictes Node

👉 donc il simplifie énormément :

✔ pas besoin de build step
✔ pas besoin de NodeNext strict
✔ pas besoin de bundler

# 3. ESLint (analyse statique)

👉 ne compile pas
👉 ne lance pas le code
👉 ne connaît pas runtime

Il fait uniquement :

validation syntaxique
règles de style
détection d’erreurs

# 4. Vitest

👉 test runner

Il fait :

exécute code TS
fournit describe / it / expect
s’appuie sur Node ou Vite

# 5. Résumé mental GLOBAL

## 5.1. 4 systèmes indépendants :

1. Langage → TypeScript
2. Runtime → Node / tsx
3. Modules → ES / CJS / NodeNext / Bundler
4. Tools → ESLint / Vitest / Vite

👉 chaque outil a son propre système de modules

Node → runtime modules
TypeScript → moduleResolution
Vite → bundler modules
ESLint → parsing uniquement
tsx → simplifie tout

## 5.2. CAS (important)

Nous sommes dans le setup :

- tsx → exécution TS directe
- monorepo → plusieurs packages
- backend tests → Node runtime

👉 donc PAS BESOIN de :

- NodeNext
- Node16 strict
- ESM pur Node config

## 5.3. règle d’or (ultra importante)

👉 Plus tu es dans tsx :

moins tu dois configurer Node “comme Node”
