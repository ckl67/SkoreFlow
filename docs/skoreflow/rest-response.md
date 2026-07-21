# HTTP Responses in a REST API

## JSON DTOs vs File Streaming

A REST API does not only return JSON.

An HTTP response can return **any kind of content**:

- JSON
- Images
- PDF files
- Audio
- Video
- ZIP archives
- Plain text
- HTML
- ...

The browser decides how to interpret the response based on the **Content-Type (MIME Type)** sent by the server.

Understanding this distinction is essential when designing a backend.

---

## Two Families of Endpoints

A backend generally exposes two completely different categories of endpoints.

### Data Endpoints (JSON)

These endpoints return structured data.

Example:

```go
GET /api/me
```

Response

```json
{
  "message": "Profile loaded",
  "user": {
    "id": 42,
    "login": "john",
    "avatar_path": "users/user-42.png"
  }
}
```

Typical use:

- CRUD (Create Update Delete)
- Authentication
- Search
- Pagination
- Forms
- Configuration

These endpoints almost always use DTOs.

---

### Resource Endpoints (Files)

These endpoints return the resource itself.

Example

```go
GET /api/users/42/avatar
```

The response is **not JSON**.

Instead, the backend returns

```go
Content-Type: image/png
```

followed by the raw PNG bytes.

The browser immediately knows it is receiving an image.

Exactly the same applies for:

```go
GET /api/scores/15/pdf
```

Response

```go
Content-Type: application/pdf
```

or

```go
GET /api/audio/123
```

Response

```go
Content-Type: audio/mpeg
```

---

## DTO Pattern

The project correctly uses DTOs for JSON endpoints.

Controller

```go
response := dto.GetComposerResponse{
    Message: "Composer loaded",
    Composer: dto.ToComposerPublicResponse(composer),
}

responses.SUCCESS(c, http.StatusOK, response)
```

DTO

```go
type GetComposerResponse struct {
    Message  string
    Composer ComposerPublicResponse
}
```

Frontend

```ts
export type GetComposerResponse = {
  message: string;
  composer: ComposerPublicResponse;
};
```

Everything is strongly typed.

---

## Why File Endpoints Don't Need DTOs

Consider

```go
GET /api/users/42/avatar
```

The response is

```go
PNG image bytes
```

There is no JSON.

Therefore there is no DTO.

The response itself **is the file**.

---

## Backend Examples

### JSON Endpoint

```txt
GET /api/me
```

```txt
      Client
        │
        ▼
      Controller
        │
       DTO
        │
      JSON
```

Example

```go
responses.SUCCESS(...)
```

---

### Image Endpoint

```go
GET /api/users/42/avatar
```

```txt
    Client
      │
      ▼
    Controller
      │
    File
      │
    Content-Type: image/png
```

Example

```go
c.File(path)
```

No DTO.

---

## Browser Behavior

Suppose HTML contains

```html
<img src="/api/users/42/avatar" />
```

The browser automatically performs

```go
GET /api/users/42/avatar
```

If the backend replies

```go
Content-Type: image/png
```

the browser renders the image.

No JavaScript is required.

---

## Same Principle in React

```tsx
<img src={`${API_URL}/users/${id}/avatar`} />
```

React does nothing special.

It simply creates an HTML `<img>` element.

The browser downloads the image itself.

---

## MIME Types

The server tells the browser what kind of resource is returned.

Common MIME types:

| Resource | MIME Type        |
| -------- | ---------------- |
| JSON     | application/json |
| PNG      | image/png        |
| JPEG     | image/jpeg       |
| GIF      | image/gif        |
| SVG      | image/svg+xml    |
| PDF      | application/pdf  |
| ZIP      | application/zip  |
| MP3      | audio/mpeg       |
| MP4      | video/mp4        |
| Text     | text/plain       |
| HTML     | text/html        |

---

## Gin Helpers

Gin provides convenient helpers.

### JSON

```go
c.JSON(...)
```

or

```go
responses.SUCCESS(...)
```

---

#### File

```go
c.File(path)
```

---

#### File Attachment (Download)

```go
c.FileAttachment(path, "score.pdf")
```

The browser downloads the file.

---

#### Stream

```go
c.Data(...)
```

Useful when the file exists only in memory.

---

## DTO vs Resource Summary

### JSON Endpoint DTO

```txt
       Request
          │
      Controller
          │
         DTO
          │
         JSON
          │
  Frontend TypeScript
```

Typed on both backend and frontend.

---

### Resource Endpoint

```txt
       Request
          │
      Controller
          │
        File
          │
       Browser
```

No DTO.

No TypeScript model.

Only the resource URL matters.

---

## Best Practice

A REST API should generally:

- return JSON for business data
- return files through dedicated resource endpoints
- expose URLs inside DTOs rather than filesystem paths
- never expose internal storage directories
- keep DTOs focused on business objects
- let the browser handle images, PDFs and media directly

This separation produces a clean, scalable architecture and follows common REST API design practices.
The distinction between AssetRoot (versioned static files) and DataRoot (user-generated files)
It makes the origin of each file immediately clear and prevents immutable resources from being mixed up with user data.
