# Backend vs Frontend Responsibilities

## Philosophy

SkoreFlow follows a **server-driven data management** architecture.

The backend is responsible for querying, filtering, sorting, and paginating data.
The frontend is responsible for presenting data and providing a responsive user interface.

This separation keeps the application scalable while maintaining a clean architecture.

---

## Backend Responsibilities

The backend owns all operations that require access to the complete dataset.

Examples:

- Database queries
- Pagination (`page`, `limit`)
- Sorting (`sort`)
- Filtering (`name`, `isVerified`, ...)
- Security and authorization
- Business rules
- Data validation
- File management (avatars, composer images, PDFs, ...)
- Performance optimization

Typical API request:

```http
GET /api/composers?page=3&limit=20&sort=name asc
```

The backend returns only the requested subset of data together with pagination metadata.

Example response:

```json
{
    "page": 3,
    "limit": 20,
    "total_rows": 845,
    "total_pages": 43,
    "composers": [
        ...
    ]
}
```

---

## Frontend Responsibilities

The frontend never assumes it owns the complete dataset.

Its role is to:

- Request data from the backend
- Display the current page
- Render tables, cards and forms
- Handle user interactions
- Display loading and error states
- Navigate between pages
- Refresh data when filters change

The frontend should **not** implement its own pagination or sorting over the entire database.

Instead, it simply requests another page from the backend.

Example flow:

```text
User clicks "Next Page"
        │
        ▼
GET /api/composers?page=4
        │
        ▼
Backend executes SQL query
        │
        ▼
Returns only page 4
        │
        ▼
React updates the UI
```

---

## Why this approach?

### Scalability

Loading every record into the browser works for:

- 20 composers
- 100 composers

It does **not** scale to:

- 10,000 composers
- 250,000 scores
- Millions of users

Server-side pagination keeps memory usage, network traffic and loading time under control.

---

### Single Source of Truth

Sorting and filtering are implemented only once:

- Backend = data logic
- Frontend = presentation logic

This avoids duplicated implementations and inconsistent results.

---

### Better Performance

Only the visible records are transferred over the network.

Example:

Instead of downloading:

```text
10,000 composers
```

the frontend downloads only:

```text
20 composers
```

for the current page.

---

## Frontend Hooks

Hooks should represent the current page of data, not the entire database.

Good:

```ts
useComposersPage({
  page,
  limit,
  sort,
  name,
  isVerified,
});
```

Avoid:

```ts
useComposers();
```

if it suggests loading every composer.

---

## Guiding Principle

The **Backend**

- Owns the data.
- Owns business rules.
- Owns queries.
- Owns performance.

The **Frontend**

- Owns the user experience.
- Displays data.
- Sends user requests.
- Reacts to backend responses.

The backend decides **what data exists**.

The frontend decides **how that data is presented**.
