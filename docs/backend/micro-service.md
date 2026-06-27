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
pip install -r requirements.txt
./venv/bin/pip install -r micro-service/requirements.txt
```
