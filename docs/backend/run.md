# backend Run 

## Running the Backend with Make

Make is a build automation tool that can be used to simplify the process of running the backend.
To run the backend using Make, you can use the following command from the root of the project

```shell
make run help
```
This command will display the available Make targets, including the one for running the backend, or cleaning the build, etc. 

example of the output:

```shell
Available commands:
  make build       : Compile the project with version injection
  make run         : Run the project with version injection
  make air         : Run with air allowing hot reload
  make version     : Show the version to be injected
  make tidy        : Clean up dependencies
  make reset       : Clear cache and reinstall everything
  make clean       : Remove the binary
  make help        : Show this help message
```


## Normal Run

It is mandatory to run the backend from the root of the project
This is because the backend relies on the .env file located at the root of the project, which contains essential configuration variables for the application.


```shell
go run ./cmd/server/main.go
# or
make run 


```

## Run with Air (Hot Reload)

Mandatory to run the backend from the root of the project

```shell
air
# or 
make air

```         