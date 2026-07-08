# Type vs Interface in TypeScript

## General rule

In modern TypeScript projects, prefer **`type` by default**.

Use **`interface` only when you need its specific features**, mainly type extension and declaration merging.

---

## Use `type` for most application code

Recommended for:

- API DTOs
- API responses
- React Props
- React Context types
- Hooks
- Function signatures
- Union types
- Generic utilities

Example:

```ts
type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
};
```

type is more flexible because it can describe:

```ts
type Status = 'loading' | 'success' | 'error';

type UserWithRole = User & {
  role: string;
};
```

## Use interface for extension / declaration merging

Main use cases:

- Extending library types
- Global type augmentation
- .d.ts files

Example (vite-env.d.ts):

```ts
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

This works because TypeScript can merge interfaces with existing definitions from Vite.
Here interface is MANDATORY !

## Quick decision rule

| Situation                    | Use         |
| ---------------------------- | ----------- |
| React component props        | `type`      |
| API models                   | `type`      |
| Context types                | `type`      |
| Function types               | `type`      |
| Union / Intersection         | `type`      |
| Extending external libraries | `interface` |
| `.d.ts` global declarations  | `interface` |

## For a React + TypeScript project

Use:

- type for 95% of your code
- interface only for framework/library extensions

Example:

```txt
src/
 ├── types/
 │    ├── user.ts        -> type
 │    ├── api.ts         -> type
 │
 └── vite-env.d.ts       -> interface
```
