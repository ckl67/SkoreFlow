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

### venv vs poetry

venv is Python’s standard tool for creating a virtual environment.
It creates a folder (often named .venv or env) directly within the project directory.
All libraries are installed there. It deals solely with isolating packages.
Limitations: It does not manage Python versions, and it does not help manage complex dependencies
(you need to use a separate requirements.txt file and install the packages manually using pip).

### Poetry

Poetry is a tool for dependency management and packaging in Python.

#### Introduction

Poetry is an ‘all-in-one’ tool. It’s not just a virtual environment manager; it’s a project and dependency manager.

Where are the files?
By default, Poetry creates the virtual environment in a centralized folder within the user directory (usually in ~/.cache/pypoetry/virtualenvs/). This environment remains strictly isolated and specific to a single project.
Project A will not have access to the libraries of Project B.

Note: You can configure Poetry to place the environment within your project, like venv, using the command: poetry config virtualenvs.in-project true.

The `poetry.lock` file records the exact version of every sub-library installed assuring the same environment, down to the last bit.

#### Installation

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

### Update

```shell
# In micro-service directory
poetry update
```

## Handled by Go

For simplification, the package installation will be handled by GO Via run `poetry install`, which will do following :
“Look the configuration files, download exactly the Python dependencies required for SkoreFlow, and isolate them in a secure location so that Go code can execute them properly via `poetry run`.”

## Poetry run

By typing `poetry run python my_script.py`, Poetry doesn’t just launch Python. It first locates the virtual environment that it created specifically for this project.

It then temporarily modifies your terminal’s environment variables (notably the PATH variable and Python’s `sys.path`) just for the duration of the execution. By doing this, it tells Python: “Look first in my project-specific libraries folder before looking elsewhere.”
