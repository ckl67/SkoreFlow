# =========================================================
# Thumbnail Service - Makefile
# 	In Python, the official environment variable for extending the module
# 	search paths is PYTHONPATH (without an underscore).
#
# 	However, after introduction setup.py and run `pip install -e .` in the virtual environment:
# 	`PYTHONPATH=src` is no longer required:
# 	The `my_app` package is now recognized directly within the venv.
# =========================================================


VENV = ./venv
PYTHON = $(VENV)/bin/python
PIP = $(VENV)/bin/pip
GUNICORN = $(VENV)/bin/gunicorn

APP = my_app.app:app
HOST = 0.0.0.0
PORT = 5001

# Versioning metadata (Git)
VERSION    := $(shell git describe --tags --match "thumbnail/*" --always 2>/dev/null || echo "dev")
COMMIT     := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_DATE := $(shell date -u +%Y-%m-%dT%H:%M:%SZ)

.PHONY: gen-version run run-debug run-prod run-flask test install install-dev reinstall help stop kill

# ---------------------------------------------------------
# VERSION GENERATION
# ---------------------------------------------------------

gen-version:
	@mkdir -p src/my_app
	@echo '__version__ = "$(VERSION)"' > src/my_app/_version.py
	@echo '__commit__ = "$(COMMIT)"' >> src/my_app/_version.py
	@echo '__build_date__ = "$(BUILD_DATE)"' >> src/my_app/_version.py
	@echo "Version generated : $(VERSION) ($(COMMIT))"

# ---------------------------------------------------------
# DEFAULT RUN (Gunicorn)
# ---------------------------------------------------------

run: gen-version
	MS_NAME=ThumbnailService \
	$(GUNICORN) $(APP) --bind $(HOST):$(PORT)

# ---------------------------------------------------------
# DEBUG MODE (verbose logs + reload)
#
# 	When we set --log-level debug on Gunicorn:
#   We are changing the log level of the HTTP server itself.
#  		Gunicorn will display very verbose system details in the terminal:
#			the management of its worker processes, the starting and stopping of threads, raw network packet reception, system signals, etc.
#
#    	This does not automatically affect the dynamic configuration of `logger.debug()` calls written in Flask routes,
#			unless you have explicitly linked the Flask logger to Gunicorn’s.
# ---------------------------------------------------------

run-debug: gen-version
	MS_NAME=ThumbnailService \
	$(GUNICORN) $(APP) \
	--bind $(HOST):$(PORT) \
	--log-level debug \
	--reload \
	--access-logfile - \
	--error-logfile -

# ---------------------------------------------------------
# QUIET MODE (production-like minimal logs)
# ---------------------------------------------------------

run-prod: gen-version
	MS_NAME=ThumbnailService \
	$(GUNICORN) $(APP) \
	--bind $(HOST):$(PORT) \
	--log-level warning \
	--access-logfile - \
	--error-logfile -

# ---------------------------------------------------------
# LOCAL DEV (Flask built-in server)
# ---------------------------------------------------------

run-flask: gen-version
	MS_NAME=ThumbnailService \
	$(PYTHON) -m my_app.app

# ---------------------------------------------------------
# TESTS
# ---------------------------------------------------------

test: gen-version
	MS_NAME=ThumbnailService \
	$(VENV)/bin/pytest tests/

# ---------------------------------------------------------
# INSTALL DEPENDENCIES
# ---------------------------------------------------------

install:
	$(PIP) install -r requirements.txt
	$(PIP) install -e .

install-dev: install
	$(PIP) install -r requirements-dev.txt
	$(PIP) install -e .

# ---------------------------------------------------------
# REINSTALL CLEAN VENV
# ---------------------------------------------------------

reinstall:
	rm -rf $(VENV)
	python3 -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt -r requirements-dev.txt
	$(PIP) install -e .

# ---------------------------------------------------------
# STOP
# (The -k flag sends a termination signal to processes using TCP port 5001).
# ---------------------------------------------------------

stop:
	@-fuser -k 5001/tcp 2>/dev/null || true
	@echo "Port 5001 has been released (or is already free)."

kill:
	@-fuser -k 5001/tcp 2>/dev/null || true
	@echo "Port 5001 has been released (or is already free)."

# ---------------------------------------------------------
# HELP
# ---------------------------------------------------------

help:
	@echo "Available commands:"
	@echo "  make run         -> Run in production via Gunicorn"
	@echo "  make run-debug   -> Run in development with debug logs and auto-reload"
	@echo "  make run-prod    -> Run with stripped-down logs"
	@echo "  make run-flask   -> Run via the Flask dev server"
	@echo "  make test        -> Run the test suite (pytest)"
	@echo "  make gen-version -> Regenerate the _version.py file"
	@echo "  make install     -> Install production dependencies"
	@echo "  make install-dev -> Install production and development dependencies"
	@echo "  make reinstall   -> Rebuild the venv from scratch"
	@echo "  make stop 				-> Free Port 5001 "
	@echo "  make kill 				-> Free Port 5001 "



