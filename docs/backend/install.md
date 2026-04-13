# Contributing Guide

This document explains the step by step to set up the development environment and follow the contribution workflow for the SkoreFlow backend project.

---

## 1. Clone the Repository

```bash
git clone https://github.com/ckl67/skoreflow.git
cd skoreflow
```

---

## 2. Prerequisites

Make sure you have the following installed:

- Go (programming language and compiler)
- See below for specific installation instructions.


---

## 3. Remove Previous Go Installation

Before installing a clean version:

```bash
sudo apt remove golang-go golang
sudo rm -rf /usr/local/go
```

---

## 4. Install Go

It is not recommended to install Go using snap.
We are using the specific version 1.24.0 to ensure compatibility with our codebase and avoid potential issues with newer versions.

```bash
wget https://go.dev/dl/go1.24.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.24.0.linux-amd64.tar.gz
```

Add Go to your path 

```bash
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# To make it permanent (add to your .bashrc file):
echo 'export PATH=$PATH:$(go env GOPATH)/bin' >> ~/.bashrc
source ~/.bashrc

# Verify installation
go version
go env GOPATH
which go
```


### Verify installation

```bash
go version
```

---

## 5. Backend Setup

Clean and synchronize dependencies:

```bash
go clean -modcache
go mod tidy
```


---


## 8. Branching Strategy

- main: production-ready code  
- dev: integration branch  
- feature branches: feature/<name>  

Example:

```bash
git checkout -b feature/add-auth-endpoint
```

---

## 9. Commit Guidelines

Use clear and structured commit messages:

type(scope): description

### Examples

```
feat(auth): add login endpoint
fix(user): correct validation bug
refactor(sheet): improve file handling
```

---

## 10. Pull Request Rules

Before submitting a pull request:

- Ensure the project builds successfully  
- Run:

```bash
go mod tidy
```

- Keep pull requests small and focused  
- Provide a clear description:
  - what was done  
  - why  
  - any side effects  

---

## 11. Code Style

- Follow standard Go conventions (gofmt, go vet)  
- Keep functions small and focused  
- Avoid unnecessary abstractions  
- Use explicit error handling  

---

## 12. Testing

Run tests:

```bash
go test ./...
```

---

## 13. Notes

- Avoid breaking existing APIs  
- Maintain consistency with the current architecture  
- Prefer readability over cleverness  

---

## 14. Questions

If something is unclear, open an issue or start a discussion.