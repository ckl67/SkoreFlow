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
