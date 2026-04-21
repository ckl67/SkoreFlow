# Auto testing

This page provides instructions on how to run automated tests for the SkoreFlow backend.
Automated testing is crucial for ensuring the reliability and stability of the application as it evolves.

This part will also address some manual tests

In order to access the database, you can use sqlitebrowser, a graphical tool that allows you to interact with SQLite databases. It provides an intuitive interface for browsing, querying, and managing your SQLite databases without needing to use command-line tools.
For more information on how to install and use sqlitebrowser, please refer to the [sqlitebrowser guide](./sqlite.md).

## Running Tests

To run the automated tests, you can use the following command from the root of the backend project:

```bash
cd auto-test
bash auto-test.sh --help

# or with multi parameters !
bash auto-test.sh --clean --users --composers

```

This command will execute the test suite, which includes various test cases designed to validate the functionality of the backend.
All the tests must pass successfully for the backend to be considered stable.

## Manual Testing

In addition to automated tests, you can also perform manual testing to verify specific functionalities or to debug issues.
Manual testing involves executing specific API calls or actions and observing the results to ensure they meet the expected outcomes.

Some manual testing commands are provided below, but you can also create your own based on the API endpoints and functionalities you want to test.

```bash
# In Bash, variables inside single quotes '...' are not interpolated (expanded).
# Solution: Always use double quotes "... to include variables.
```

List of manual tests:
[smoke](./manual-tests/smoke-mtest.md)
[register and login](./manual-tests/user-mtest.md)
[composer](./manual-tests/composer-mtest.md)
[sheet](./manual-tests/sheet-mtest.md)

## Autotests Coding

Automated tests are now implemented in **JavaScript (Node.js)**.

This approach provides more flexibility compared to shell-based testing, especially for:

- complex workflows
- API chaining
- file uploads (multipart/form-data)
- structured assertions and error handling

---

### Project Structure

The test suite is organized as follows:

```bash
testauto/
    auto-test.sh        # Main test runner (entry point)
    config.js           # Global configuration (API URL, etc.)
    helpers/            # Reusable logic (API calls, assertions, auth, reset)
    tests/              # Test suites grouped by domain
    resources/          # Test assets (images, PDFs, etc.)
```

### Dependencies

The test framework relies on the following Node.js libraries:

- axios → HTTP client used for all API requests
- form-data → Required for multipart requests (e.g. file uploads)

To install dependencies:

```shell
npm install

# Or manually:

npm install axios form-data
```

Notes

- All HTTP requests are now handled via a unified axios-based helper.
- Multipart uploads (e.g. avatar, PDF) require form-data to properly replicate curl -F behavior.
- The shell script (auto-test.sh) remains the entry point and orchestrates test execution.

This setup ensures consistency, maintainability, and better debugging capabilities compared to raw shell scripts.

# ESM signifie ECMAScript Modules.

Because we are using typestrict, a modification of package.json is mandotory to indicate that we are using module

```json
{
  "type": "module",
  "dependencies": {
    "axios": "^1.15.1",
    "form-data": "^4.0.5"
  },
  "devDependencies": {
    "@types/node": "^25.6.0",
    "ts-node": "^10.9.2",
    "typescript": "^6.0.3"
  }
}
```
