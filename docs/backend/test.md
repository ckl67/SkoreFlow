# Auto testing

This page provides instructions on how to run automated tests for the SkoreFlow backend.
Automated testing is crucial for ensuring the reliability and stability of the application as it evolves.

This part will also address some manual tests

In order to access the database, you can use sqlitebrowser, a graphical tool that allows you to interact with SQLite databases.
It provides an intuitive interface for browsing, querying, and managing your SQLite databases without needing to use command-line tools.
For more information on how to install and use sqlitebrowser, please refer to the [sqlitebrowser guide](./sqlite.md).

## Running auto-test Tests

To run the automated tests, you can use the following command from the root of the backend project:

```bash
cd auto-test
bash auto-test.sh --help

# or with multi parameters !
bash auto-test.sh --clean --users --composers
```

This command will execute the test suite, which includes various test cases designed to validate the functionality of the backend.
All the tests must pass successfully for the backend to be considered stable.

## Manual curl Testing

In addition to automated tests, you can also perform manual curl (client URL request library ) testing to verify specific functionalities or to debug issues.

However, we recommend to use tests via vitest, which is much more user friendly !

Below some manual testing commands, but you can also create your own based on the API endpoints and functionalities you want to test.

[smoke](./manual-tests/smoke-mtest.md)
[register and login](./manual-tests/user-mtest.md)
[composer](./manual-tests/composer-mtest.md)
[score](./manual-tests/score-mtest.md)

## Autotests with Vitest

Automated tests are also implemented in **JavaScript (Node.js)**.

This approach provides more flexibility compared to shell-based testing, especially

- complex workflows
- API chaining
- file uploads (multipart/form-data)
- structured assertions and error handling

### Project Structure

The test suite is organized as follows:

```bash
testauto/
    auto-test.sh or air # Main test runner (entry point)
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

### Vitest VSC Code Integration

To get the most out of Vitest, use the graphical interface:

- Install Extension: Search for and install the Vitest extension in VS Code.
- The "Vial" Icon: Click the Testing icon (looks like a lab flask) in the Activity Bar on the left.
- Run Tests: You can now see all your tests in a tree view. Click the Play button to run a specific test or a whole file.

## Recommended Workflow

To test effectively, you should use a "Two-Speed" workflow:

### Step 1: Coding & Testing (via Vitest)

During coding phase.

```Bash
  make run-test
  # or better
  make air-test
  # or eventually
  bash auto-test.sh --help # --> to specify the suite option
```

Then to run individually the vitest tests via vsc interface.

### Step 2: Infrastructure (The Shell Script)

For un full test before any commitment

```Bash
    #Action: Run
    bash auto-test.sh --help # --> to specify the suite option

```

All the tests must pass !!
