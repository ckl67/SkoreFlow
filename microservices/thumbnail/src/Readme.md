# Overview

```text
.
├── Makefile
├── requirements.txt
├── requirements-dev.txt
├── README.md
├── .gitignore
├── setup.py                # setup.py and running pip install -e  is the standard Python solution to include src in python env
│
├── src/
│   └── my_app/
│       ├── __init__.py
│       ├── _version.py        # Generated automatically by the Makefile
│       ├── app.py             # Flask server
│       └── logger.py
│
└── tests/
    ├── test_app.py
    └── storage/               # Test files (PDFs, images, etc.)


```

## Environment variable

In Python, the official environment variable for extending the module search paths is `PYTHONPATH` (without an underscore).

```shell
run-flask: gen-version
  MS_NAME=ThumbnailService \
  PYTHONPATH=src $(PYTHON) -m my_app.app
```

When the project is run with `PYTHONPATH=src`, the src/ folder becomes the root directory for Python imports.
We must therefore import directly from my_app.

```python
from my_app.logger import configure, get_current_level, logger
```

## Understanding Python Imports, Root Folders, and setup.py

- [Python Imports, Root Folders](./../../../docs/general/python-Imports-rootfolder.md)
