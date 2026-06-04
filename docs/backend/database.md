# Database Migration Strategy (GORM AutoMigrate)

SkoreFlow currently relies on `GORM AutoMigrate()` for schema evolution.

`AutoMigrate()` is convenient for development and small/medium project evolution, but it has important limitations that developers must understand.

## What AutoMigrate handles well

- Create new tables
- Add new columns
- Add simple indexes
- Apply basic schema synchronization

## Recommended usage rules

To keep migrations safe and backward-compatible:

- Prefer adding **nullable** columns first
- Introduce schema changes progressively
- Keep compatibility with older databases
- Avoid destructive changes directly in models

Example (safe):

```go
PendingEmail *string `gorm:"size:100"`
```

## What AutoMigrate does NOT safely handle

- Column deletion
- Complex column renaming
- Data transformation/migration
- Complex constraint changes
- Reliable rollback management
- Advanced production migration workflows

## Important

AutoMigrate() does NOT provide intrinsic database versioning.

It does not maintain:

- migration history
- schema versions
- ordered migration execution

For larger production deployments or complex schema evolution, a dedicated migration system should eventually be introduced (e.g. golang-migrate, Goose, Atlas, etc.).

## Current SkoreFlow approach

At the current stage of the project, AutoMigrate() is considered acceptable as long as schema changes remain incremental, non-destructive,
and carefully tested against existing databases.
