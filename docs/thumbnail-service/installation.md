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

## Gunicorn

[Gunicorn](https://gunicorn.org/) 'Green Unicorn' is a Python WSGI HTTP Server for UNIX.
It's a pre-fork worker model ported from Ruby's Unicorn project.
The Gunicorn server is broadly compatible with various web frameworks, simply implemented, light on server resource usage, and fairly speedy.

## venv

### Create the virtual environment

```shell
# In directory  thumbnail-service/
python3 -m venv venv
```

Activate the environment

```shell
source venv/bin/activate
```

Install the dependencies

```shell
pip install flask pdf2image Pillow gunicorn
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
./venv/bin/pip install -r micro-service/requirements.txt
```

## Uninstall

```shell
pip uninstall flask pdf2image pillow gunicorn requests
```

## run

```shell

# app = app.py file
# app: app = Flask variable (app = Flask(__name__))
# --bind = exposed port
gunicorn app:app --bind 0.0.0.0:5001

# Run development server (only local debug)
python app.py

```

## For test

In directory : thumbnail-service/test$

```shell
python3 -m venv venv
source venv/bin/activate
pip install flask pdf2image Pillow gunicorn  requests
pip freeze > requirements_test.txt
```

## curl

```shell
 curl http://localhost:5001/health

 curl -X POST http://localhost:5001/createthumbnail \
    -H "Content-Type: application/json" \
     -d '{
       "pdf_path": "/home/christian/SkoreFlow_Project/SkoreFlow/thumbnail-service/test/storage/ballade.pdf",
       "output_path": "/home/christian/SkoreFlow_Project/SkoreFlow/thumbnail-service/test/storage/thumbnail_ballade.png"
     }'
```
