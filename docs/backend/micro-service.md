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

## venv

### Remark about venv vs poetry

For render.com it is much more simple to manage venv than poetry
Also each environment manages ITS Python. Go has not to define which python to use

```shell
# Model A (local venv)
#   python = venv/bin/python3
#   libs = within venv
# Model B (Render)
#   python = system python3
#   libs = installed globally at build time
```

```shell
pip install -r micro-service/thumbnail-service/requirements.txt
```

### Create the virtual environment

```shell
python3 -m venv venv
```

Activate the environment

```shell
source venv/bin/activate
```

Install the dependencies

```shell
pip install flask pdf2image Pillow
```

Create the dependencies file

```shell
pip freeze > requirements.txt
```

## In case of issue

Don't hesitate to remove the venv directory, and to restart !

```shell
rm -rf venv
```

And start again with installation !

## Update

```shell
pip install -r requirements.txt
./venv/bin/pip install -r micro-service/requirements.txt
```
