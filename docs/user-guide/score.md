<style>
  body {
    background-color: #ffffff !important;
    color: #000000 !important;
  }
</style>

[← back](./summary.md)

# Score

## Creation

Everybody can create a score
However creating a score needs to know a composer

Several option in case composer is not created or not verified
In case the composer is not created, user must create the composer
After

- `(IsVerified=true)`
  - Score will be created
- `(IsVerified=false)`
  - Score visible but marked as ‘pending’?

## Annotations

Frontend is responsible about the annotations.
Meaning that the annotation update will completely remove the stored annotation, to replace them with the new annotations
