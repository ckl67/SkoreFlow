# Test Mode Resources

## Description

This directory contains all resources used when the application is started in **Test Mode**.

Test Mode automatically seeds the database with predefined data (users, composers, scores, avatars, etc.) and copies the required assets into the application's storage.

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
  - Invalid and oversized images used for testing validation

- `resources/composers/`
  - Composer profile pictures used during database seeding

- `resources/scores/`
  - Sample PDF scores organized by composer
  - Used to populate the database and test score management features

## Notes

- These resources are intended **for development and automated testing only**.
- They are **not** used in production.
- The application expects this directory to be present when `TEST_MODE=true`.
