# Create the microservice

## Prerequisites

### pdftoppm

pdftoppm is the tool that pdf2image calls in the background to convert PDF pages into PNG/JPEG images.
pdftoppm is normally installed on Linux.

```shell
## Verification version
pdftoppm -v
```

for installation

```shell
sudo apt update && sudo apt install poppler-utils
```

### Poetry

Poetry is a tool for dependency management and packaging in Python.

```shell
# Run this command in your microservice folder: /SkoreFlow/backend/micro-service
curl -sSL https://install.python-poetry.org | python3 -
```

```Bash
# Next command will generate a brand-new file called pyproject.toml.
poetry init --no-interaction
```

```shell
# Add your dependencies
poetry add flask pdf2image Pillow
```

## Update

```shell
# In micro-service directory
poetry update
```

## Handled by Go

The package installation are handled by GO
Via run `poetry install`, which will do following :
“Look the configuration files, download exactly the Python dependencies required for SkoreFlow, and isolate them in a secure location so that Go code can execute them properly via `poetry run`.”
