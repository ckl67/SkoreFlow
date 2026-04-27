# JSON Fundamentals for REST APIs (Go / Gin)

## What Is JSON, Formally?

The JSON standard (RFC 8259) defines a JSON document simply as: **a JSON value**.

A JSON value can be one of six types:

- object
- array
- string
- number
- boolean
- null

So a JSON **object** is just one of many possible types. Despite the name — _JavaScript Object Notation_ — JSON does not have to be an object. The name comes from JavaScript's object literal syntax.

> **Note:** JSON has no native date type.

---

## Valid JSON: Six Examples

All six of the following are valid JSON documents:

**Object**

```json
{ "name": "Christian" }
```

**Array**

```json
[1, 2, 3]
```

**String**

```json
"hello"
```

**Number**

```json
42
```

**Boolean**

```json
true
```

**Null**

```json
null
```

---

## Simplified JSON Grammar

```
JSON-text = value

value =
    false
  | null
  | true
  | object
  | array
  | number
  | string
```

An object is just one possible case.

---

## JSON in REST APIs

In modern backends (Go, Gin, REST), we almost always return a JSON **object** as the response body — but this is a convention, not a rule of the format.

```json
{ "data": "..." }
```

JSON is a text-based data exchange format standardized by RFC 8259, widely used in REST APIs. In Go, it is handled via the standard library:

```go
import "encoding/json"
```

---

## JSON Object Structure

### Example 1 — Basic object

```json
{
  "name": "Christian",
  "age": 42,
  "admin": true
}
```

### Example 2 — Object with a nested array

```json
{
  "name": "Christian",
  "roles": ["admin", "editor"]
}
```

Here:

- root = object `{}`
- `roles` = array `[]`
- each array element is a string

---

## Quoting Rules

### Keys are always double-quoted

```json
{ "name": "Christian" }
```

❌ Invalid — unquoted keys are not allowed:

```json
{ "name": "Christian" }
```

JSON requires keys to be strings, so they must always use double quotes.

### Values depend on their type

| Type          | Syntax                       | Example                        |
| ------------- | ---------------------------- | ------------------------------ |
| String        | Double quotes (never single) | `"name": "Christian"`          |
| Number        | No quotes                    | `"age": 42`                    |
| Boolean       | No quotes                    | `"admin": true`                |
| Null          | No quotes                    | `"deleted_at": null`           |
| Array         | Square brackets              | `"roles": ["admin", "editor"]` |
| Nested object | Curly braces                 | `"user": { "id": 1 }`          |

❌ Common mistakes:

```json
"age": "42"      // This is a string, not a number
"admin": "true"  // This is a string, not a boolean
```

---

## JSON Serialization in Go

### Struct Definition

```go
type User struct {
    ID   uint32 `json:"id"`
    Name string `json:"name"`
    Age  int    `json:"age"`
}
```

The struct tag `json:"name"` tells the encoder which key name to use in the JSON output.

### Serialization

```go
json.Marshal(user)
```

Output:

```json
{
  "id": 1,
  "name": "Christian",
  "age": 42
}
```

---

## Handling `time.Time` in JSON

### What `time.Time` Is

`time.Time` is a struct from the standard library:

```go
import "time"
```

It stores a date, time, timezone, and nanosecond precision.

### How Go Serializes `time.Time`

When marshaling, Go automatically converts `time.Time` to an **RFC 3339 string**.

```go
type User struct {
    CreatedAt time.Time `json:"created_at"`
}
```

Output:

```json
{ "created_at": "2026-03-01T10:15:30Z" }
```

Key points:

- It is serialized as a **string**
- Format: **RFC 3339** (not a Unix timestamp)
- Default format: `2006-01-02T15:04:05Z07:00`

### Common Errors

**Wrong format from frontend:**

```json
{ "created_at": "01/03/2026" }
```

```
parsing time "01/03/2026" as "2006-01-02T15:04:05Z07:00": cannot parse
```

**Unix timestamp instead of string:**

```json
{ "created_at": 1709293200 }
```

```
cannot unmarshal number into Go struct field of type time.Time
```

### Why Is a Date a String in JSON?

Because JSON has no date type. Dates are represented as strings by convention (typically RFC 3339 / ISO 8601).

### Zero Value Problem

```go
type User struct {
    DeletedAt time.Time `json:"deleted_at,omitempty"`
}
```

If `DeletedAt` is the zero value, `omitempty` does **not** omit it — it still outputs:

```json
{ "deleted_at": "0001-01-01T00:00:00Z" }
```

**Best practice: use a pointer**

```go
type User struct {
    DeletedAt *time.Time `json:"deleted_at,omitempty"`
}
```

If the value is `nil`, the field is omitted from the JSON output entirely.

### GORM

GORM typically adds these fields automatically:

```go
CreatedAt time.Time
UpdatedAt time.Time
DeletedAt gorm.DeletedAt
```

---

## Frontend ↔ Backend: Full Example

### Frontend (JavaScript)

Convert to ISO 8601 before sending:

```js
const date = new Date(dateValue);
const isoDate = date.toISOString();
// Result: "2026-03-01T00:00:00.000Z"
```

Payload sent to the backend:

```json
{
  "title": "Nocturne Op.9",
  "release_date": "2026-03-01T00:00:00Z"
}
```

### Backend (Go / Gin)

**Request struct:**

```go
type CreateScoreRequest struct {
    Title       string    `json:"title"`
    ReleaseDate time.Time `json:"release_date"`
}
```

**Controller:**

```go
func CreateScore(c *gin.Context) {
    var req CreateScoreRequest

    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": err.Error(),
        })
        return
    }

    fmt.Println(req.ReleaseDate)
}
```

---

## JavaScript Object Literal Syntax (for API calls)

All three forms are valid when passing data in JavaScript:

```js
// 1. Shorthand (modern, most common)
data: { email, password }

// 2. Classic (explicit)
data: { email: email, password: password }

// 3. With string keys (identical result)
data: { "email": email, "password": password }
```
