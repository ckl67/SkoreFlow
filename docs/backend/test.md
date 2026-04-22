# Auto testing

This page provides instructions on how to run automated tests for the SkoreFlow backend.
Automated testing is crucial for ensuring the reliability and stability of the application as it evolves.

This part will also address some manual tests

In order to access the database, you can use slicebrowser, a graphical tool that allows you to interact with SQLite databases. It provides an intuitive interface for browsing, querying, and managing your SQLite databases without needing to use command-line tools.
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
[score](./manual-tests/score-mtest.md)

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

### ESM means ECMAScript Modules

Because we are using typestrict, a modification of package.json is mandatory to indicate that we are using module

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

## Vitest Testing Guide for SkoreFlow

We use Vitest for TypeScript API testing, integrated with the existing backend shell scripts.

### Installation

Navigate to your testing directory (where your package.json is located) and install Vitest as a development dependency:

```Bash
cd testauto
npm install -D vitest
```

### Configuration

Create a file named vitest.config.ts in your testauto folder. This tells Vitest where to find your tests and how to run them:

```Bash

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Looks for files ending in .test.ts or .spec.ts
    include: ['**/*.{test,spec}.ts'], 
  },
})

```

### VS Code Integration

To get the most out of Vitest, use the graphical interface:

- Install Extension: Search for and install the Vitest extension in VS Code.
- The "Vial" Icon: Click the Testing icon (looks like a lab flask) in the Activity Bar on the left.
- Run Tests: You can now see all your tests in a tree view. Click the Play button to run a specific test or a whole file.

## Recommended Workflow

To test effectively, you should use a "Two-Speed" workflow:

### Step 1: Infrastructure (The Shell Script)

Before running Vitest, your backend must be running. 
Use your Terminal or NPM script to launch the environment:


```Bash

    #Action: Run 
    bash auto-test.sh --all --clean

    # Result: Database is wiped, storage is cleared, and the Go server starts.
    # Result must be OK !

```

### Step 2: Coding & Testing (Vitest)

Once the server is "UP", stay in your TypeScript files:

- Modify: Edit your test logic Example : in composer.test.ts.
- Execute: Click "Play" in the Vitest "Vial" tab.
- Benefit: Tests run in seconds because you don't need to restart the Go server or wipe the database every time.

###  Writing Tests

Ensure your helper functions (like createComposer) return the response object and use standard assertions:

``` TypeScript

import { it, expect } from 'vitest';

it('should create a composer and return 201', async () => {
  const res = await createComposer({ name: "Bach" }, token);
  
  // Vitest assertion
  expect(res.status).toBe(201);
  expect(res.data.name).toBe("Bach");
});

``` 
### Summary of Tools:

- Shell Script (auto-test.sh): Manages the server life cycle and database state.
- Vitest: Executes granular API logic tests with fast feedback.
