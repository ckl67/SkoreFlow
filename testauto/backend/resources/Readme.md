# Test Resources

## Description

This directory contains all resources used when the backend application is started in **Test Mode**.

Test Mode automatically seeds the database of the backend with predefined data **_(users, composers, scores, avatars, etc.)_** and copies the required assets into the storage directory.

To start the application in Test Mode, run:

```bash
make run-test
```

This command starts the backend with:

```text
TEST_MODE=true
```

## Directory Structure

- `resources/avatars/`
  - Sample user avatars
- `resources/composers/`
  - Composer profile pictures used during database seeding
- `resources/scores/`
  - Sample PDF scores organized by composer

## Notes

- These resources are intended **for development and automated testing only**.
- They are **not** used in production.
- The application expects this directory to be present when `TEST_MODE=true`.
