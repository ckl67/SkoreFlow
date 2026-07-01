# 1. Go Struct Tags & Field Mapping

[← back](./../index.md)

In Go, Struct Tags are small pieces of metadata attached to struct fields.
They are strings _(enclosed in backticks)_ that provide instructions to external libraries—like encoding/json for API responses or gorm for database mapping—on how to handle each field.

## 1.1. The Core Principle: Exporting & Reflection

- Field Visibility:
  - For a field to be visible to external packages (JSON encoder, GORM, etc.), it must be Exported (start with an Uppercase letter).

- The "Magic" (Reflection):
  - Go uses a mechanism called Reflection at runtime to read these tags.
  - This allows the program to know, for example, that the Go field ID should be written as id in a JSON file or treated as a primaryKey in a database.

## 1.2. Common Struct Tag Use Cases

### 1.2.1. JSON Tags (json:"...")

These define how fields are serialized when sending API responses or receiving requests.

- Custom Naming:
  - json:"username" maps the Go field Username to the JSON key "username".
- Exclusion:
  - json:"-" tells Go to never include this field in the JSON output _(crucial for security fields like Password)_.
- Omit if Empty:
  - json:"avatar,omitempty" will hide the key in the JSON response if the string is empty.

### 1.2.2. GORM Tags (gorm:"...")

These define the database schema and constraints when using the GORM ORM.

- Primary Key:
  - primaryKey marks the field as the table's unique identifier.
- Constraints:
  - not null ensures the column cannot be empty; uniqueIndex prevents duplicate values.
- Types & Sizes:
  - size:100 defines the VAR CHAR length in the database.
- Default Values:
  - default:0 sets a fallback value if none is provided during insertion.

### 1.2.3. Application

```go
    type User struct {
    // Basic mapping: Go ID -> DB Primary Key -> JSON "id"
    ID        uint32    `gorm:"primaryKey;autoIncrement" json:"id"`

    // Constraint: Must be unique and max 100 chars
    Username  string    `gorm:"size:100;not null;uniqueIndex" json:"username"`

    // Security: Managed by DB (GORM) but hidden from API (JSON "-")
    Password  string    `gorm:"size:255;not null" json:"-"`

    // Defaults: Boolean mapping with a default state
    IsVerified bool     `gorm:"default:false" json:"isVerified"`

    // Timestamps: Standard naming convention for frontend consumption
    CreatedAt  time.Time `json:"createdAt"`

}
```

| Tag Example        | Mechanism    | Effect                                           |
| ------------------ | ------------ | ------------------------------------------------ |
| json:"name"        | Naming       | Renames the field in the API response.           |
| json:"-"           | Security     | Prevents sensitive data leakage to the client.   |
| gorm:"not null"    | Integrity    | Forces the database to require a value.          |
| gorm:"uniqueIndex" | Optimization | Creates a database index and ensures uniqueness. |
