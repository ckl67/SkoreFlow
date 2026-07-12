# Naming Conventions

This document defines the terminology used throughout the SkoreFlow codebase.
Using consistent names makes the code easier to read, review and maintain.

---

## General Principle

A name should describe **what the function does**, not **how it does it**.
Avoid ambiguous verbs such as `Load`, `Handle`, `Process` or `Manage`
unless their meaning is clearly established.

---

## Paths

### Relative Path

A path stored inside the database.
It is always relative to the application's data directory.

Example:

```text
composers/mozart/portrait.png
```

Recommended names:

Without specification, it corresponds to the file location like mostly relative !

```go
Picture
Avatar
```

Otherwise we specify relative or absolute

```go
DataRoot
RelativePath
```

Avoid:

```go
FullPath
AbsolutePath
```

---

### Absolute Path

A physical filesystem location.

Example:

```text
/var/data/storage/composers/mozart/portrait.png
```

Recommended helper:

```go
Resolve(relativePath)
```

Example:

```go
relative := paths.ComposerPictureRel(...)
absolute := paths.Resolve(relative)
```

---

## File Operations

### Build

Creates a value without touching the filesystem.

Example:

```go
relative := paths.ComposerPictureRel(...)
```

---

### Resolve

Converts a relative storage path into an absolute filesystem path.

Example:

```go
absolute := paths.Resolve(relative)
```

---

### Save

Writes data to disk.

Example:

```go
SaveFile(...)
```

---

### Copy

Copies an existing file.

Example:

```go
CopyFile(...)
```

---

### Delete file

Removes a file or directory.

Example:

```go
DeleteFile(...)
```

---

## Database Operations

## Create

Creates a new entity.

```go
CreateComposer(...)
```

---

### Update

Modifies an existing entity.

```go
UpdateComposer(...)
```

---

### Delete

Removes an entity.

```go
DeleteComposer(...)
```

---

### Find

Returns one entity.

```go
FindComposerByID(...)
```

---

### List

Returns multiple entities.

```go
ListComposers(...)
```

---

## Seed

The word _Seed_ is reserved for generating development or testing data.

Examples:

```go
Seed.Composer(...)
Seed.Users(...)
Seed.Database(...)
```

Avoid:

```go
LoadComposer(...)
```

because "Load" usually means reading existing data.

---

## Upload / Download

Use these words only when data crosses a network boundary.

Examples:

Browser
→ Upload →
Backend

Backend
→ Download →
Browser

Do not use Upload/Download for local filesystem operations.

---

## Load

Use **Load** only when reading existing data.

Examples:

```go
LoadConfig(...)
LoadTemplate(...)
LoadJSON(...)
```

Avoid using **Load** for object creation.

---

## Build vs Resolve

Build creates logical values.
Resolve converts logical values into physical ones.

Example:

```go
relative := paths.ComposerPictureRel(...)
absolute := paths.Resolve(relative)
```

---

## Package Naming and Function Names

In Go, the package name already provides context.
Function names should not repeat information already contained in the package name.
The goal is to create readable code where the package and function naturally form a sentence.

---

### Avoid Redundant Names

Avoid repeating the package name inside the function name. Example: `go seed.SeedUser(...)`
The word Seed is already provided by the package name.
This creates unnecessary repetition: `seed + SeedUser`

Prefer Context From the Package

Use the package name to provide the context:

```go
seed.User(...)
seed.Composer(...)
seed.Score(...)
```

The meaning is immediately clear:

seed.User()
-> create a seeded user

seed.Composer()
-> create a seeded composer

### When To Use Verbs

Use verbs when the action is important and not obvious from the package.

Examples:

```go
mail.Send(...)
thumbnail.Generate(...)
storage.Save(...)
paths.Resolve(...)
```

These read naturally:

- Send a mail
- Generate a thumbnail
- Save a file
- Resolve a path

### Package Context Rule

Before naming a function, ask: **"Does the package name already describe the action?"**

If yes, do not repeat it.

Good:

```go
seed.User(...)
storage.Save(...)
mail.Send(...)
```

Avoid:

```go
seed.SeedUser(...)
storage.StorageSave(...)
mail.MailSend(...)
Readability Rule
```

The package provides the context.
The function provides the intent.

---

## Guideline

A name should describe what the function does, not how it does it.
Choose the verb that best matches the actual responsibility.
