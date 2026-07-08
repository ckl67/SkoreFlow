# The Go test naming convention

## Principle

The official Go tool **(go test)** uses a system of filters based on filenames.
VS Code scans the folder and applies these rules:

- Included:
  - Only file s ending strictly with \_test.go are treated as test files.
- Ignored by the normal build:
  - These \_test.go files are completely ignored when compiling the application (using go build or go run).
  - These files are only included when running go test.

## Rules within the file

The tests to be appearing in the VS Code interface, it is not enough for the file to be named \_test.go.
The functions within it must also comply with Go syntax:

- The function name must begin with ‘Test’ followed by a capital letter (e.g. TestCompute).
- The signature must only accept the test pointer: t \*testing.T.
