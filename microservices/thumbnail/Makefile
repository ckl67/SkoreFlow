# =========================================================
# Thumbnail Service - Makefile
# =========================================================

VENV=./venv
APP=app:app
HOST=0.0.0.0
PORT=5001

# ---------------------------------------------------------
# DEFAULT (clean run)
# ---------------------------------------------------------

run:
	$(VENV)/bin/gunicorn $(APP) --bind $(HOST):$(PORT)

# ---------------------------------------------------------
# DEBUG MODE (verbose logs + reload)
# ---------------------------------------------------------

run-debug:
	MS_NAME=ThumbnailService \
	$(VENV)/bin/gunicorn $(APP) \
	--bind $(HOST):$(PORT) \
	--log-level debug \
	--reload \
	--access-logfile - \
	--error-logfile -

# ---------------------------------------------------------
# QUIET MODE (production-like minimal logs)
# ---------------------------------------------------------

run-prod:
	MS_NAME=ThumbnailService \
	$(VENV)/bin/gunicorn $(APP) \
	--bind $(HOST):$(PORT) \
	--log-level warning \
	--access-logfile - \
	--error-logfile -

# ---------------------------------------------------------
# LOCAL DEV (Flask built-in server)
# ---------------------------------------------------------

run-flask:
	MS_NAME=ThumbnailService \
	python app.py

# ---------------------------------------------------------
# INSTALL DEPENDENCIES
# ---------------------------------------------------------

install:
	$(VENV)/bin/pip install -r requirements.txt

# ---------------------------------------------------------
# REINSTALL CLEAN VENV (optional)
# ---------------------------------------------------------

reinstall:
	rm -rf $(VENV)
	python3 -m venv $(VENV)
	$(VENV)/bin/pip install --upgrade pip
	$(VENV)/bin/pip install flask pdf2image pillow gunicorn

# ---------------------------------------------------------
# STOP (useful if you later track PID)
# ---------------------------------------------------------

stop:
	@echo "Use pkill -f gunicorn or implement PID file if needed"

# ---------------------------------------------------------
# HELP
# ---------------------------------------------------------

help:
	@echo "Available commands:"
	@echo "  make run        -> production gunicorn"
	@echo "  make run-debug  -> debug mode"
	@echo "  make run-prod   -> production quiet logs"
	@echo "  make run-flask  -> flask dev server"
	@echo "  make install    -> install deps"
	@echo "  make reinstall  -> rebuild venv"
