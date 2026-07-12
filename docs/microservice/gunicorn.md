# Principle

When you run your Flask or Django application using `python app.py`, you are using the built-in development server.
It’s perfect for coding, but completely unsuitable for production.

Here’s exactly what Gunicorn offers in addition:

## Traffic handling (multi-process)

python app.py: Is generally single-threaded (a single execution thread). If two users click at the same time, the second must wait until the first user’s request has been fully completed. If a request takes 10 seconds, your site is blocked for everyone for 10 seconds.

Gunicorn: Uses a Master/Workers model. A master process manages several child processes (the workers). If you configure 4 workers, Gunicorn can process 4 requests in parallel. No more blocking.

## Robustness and stability

python app.py: If your code encounters an unhandled critical error and crashes, the Python process stops permanently. Your site is offline until you restart it manually.

Gunicorn: If a worker crashes due to a bug or a memory leak, the master process detects it instantly, terminates it and recreates a new worker in a fraction of a second. Your site remains online.

## Security and performance

The development server is neither security-audited nor optimized for speed. Gunicorn is designed to be fast, to handle slow connections efficiently (often paired with a reverse proxy such as Nginx) and to mitigate basic denial-of-service (DoS) risks.
