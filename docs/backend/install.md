# Contributing Guide

This document explains the step by step to set up the development environment and follow the contribution workflow for the SkoreFlow backend project.

---

## Clone the Repository

```bash
git clone https://github.com/ckl67/skoreflow.git
cd skoreflow
```

---

## Prerequisites

Make sure you have the following installed:

- Go (programming language and compiler)
- See below for specific installation instructions.

---

## Remove Previous Go Installation

Before installing a clean version:

```bash
sudo apt remove golang-go golang
sudo rm -rf /usr/local/go
```

---

## Install Go

It is not recommended to install Go using snap.

We are using the specific version 1.25.0 to ensure compatibility with our codebase and avoid potential issues with newer versions.
Upgrated to 1.25.0 has been requested by the use of package

```go
_ "golang.org/x/image/webp"
```

```bash
wget https://go.dev/dl/go1.25.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.25.0.linux-amd64.tar.gz
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

## Backend Setup

Clean and synchronize dependencies:

```bash
go clean -modcache
go mod tidy
```

---

## Image Format Registration in Go

The Blank Import Mechanism (\_):

In Go, importing a package with an underscore (e.g., \_ "image/jpeg") is used for the side effect of registering the format.
These packages contain an init() function that automatically registers their respective decoders (JPEG, PNG, WebP) into the core image package upon startup.

Standard Library vs. X-Repositories:

- image/jpeg and image/png are part of the Go Standard Library. They are built-in and do not affect your go.mod file.
- golang.org/x/image/webp belongs to the extended repositories.
- Because it is external to the core runtime, you must run

```shell
go get golang.org/x/image/webp
```

which adds it as a dependency in your go.mod.

Consequences of Go 1.25 Update !!

Adding a modern "x" library dependency might automatically bump (increase) your go.mod version to go 1.25.0 if the library requires the latest toolchain features. This ensures compatibility and security across all dependencies.

```go
// go.mod

go 1.25.0
```

Afterwars it is mandatory to run

```shell
make reset
```
