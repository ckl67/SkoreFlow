# JavaScript `{}` — Object Creation vs Destructuring

In JavaScript, curly braces `{}` are **overloaded syntax**.
Their meaning depends entirely on the context in which they are used. The two most common interpretations are:

- **Object Creation (Object Literal)**
- **Object Destructuring**

Understanding the distinction is essential to avoid subtle bugs.

---

## Object Creation (Object Literal)

When `{}` appears in a value position (e.g. assigned to a variable, passed as a function argument), it creates an **object literal**.

### Examples

```shell (In order to keel ")
# Explicit key/value pairs
const data = { email: email, password: password };

# Shorthand property syntax (ES6+)
const data = { email, password };

# With quoted keys (rarely needed)
const data = { "email": email, "password": password };
```

### Key Points

- { email, password } is **shorthand** for { email: email, password: password }
- Property names only need quotes if:
  - They contain special characters
  - They are not valid identifiers
    This is commonly used when passing data:

```js
apiCall({
  data: { email, password },
});
```

## Object Destructuring

When {} appears on the left-hand side of an assignment, it performs destructuring.

```js
// Examples
const user = { email: "test@example.com", password: "1234" };

// Extract properties into variables
const { email, password } = user;
// --> email = "test@example.com"

// Renaming variables
const { email: userEmail } = user;
// --> userEmail = "test@example.com"

// Default values
const { email = "default@example.com" } = user;
```

## Function Parameters: Destructuring vs Object Passing

### Passing an object (object literal)

```js
login({ email, password });
```

### Receiving with destructuring

```js
function login({ email, password }) {
  console.log(email, password);
}
```

👉 Here:

- Caller uses object creation
- Function uses destructuring

## Common Pitfall

This is a frequent source of confusion:

```js
const { email, password }; // ❌ SyntaxError
```

Why?

- Because {} is interpreted as a block, not an object or destructuring assignment.
- Destructuring requires an assignment: const { email, password } = user;

## Quick Mental Model

| Syntax Position       | Meaning         |
| --------------------- | --------------- |
| Right-hand side (`=`) | Object creation |
| Left-hand side (`=`)  | Destructuring   |
| Function argument     | Object creation |
| Function parameter    | Destructuring   |
