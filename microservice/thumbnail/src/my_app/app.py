# ------------------------------------------------------------
# Python interpreter
# Open the command palette:
#    Windows/Linux: Ctrl + Shift + P
#   Select the interpreter:
#    Type ‘Python: Select Interpreter’ and press Enter.
#     Choose your virtual environment:
# Sometimes you need to
#   Open the command palette:
#   Type ‘Python: Restart Language Server’ and press Enter.
# ------------------------------------------------------------

import os
import shutil
import time
import uuid

from flask import Flask, jsonify, request
from my_app.logger import configure, get_current_level, logger
from pdf2image import convert_from_path
from pdf2image.exceptions import PDFPageCountError, PDFSyntaxError
from PIL import Image, UnidentifiedImageError

try:
    from my_app._version import __build_date__, __commit__, __version__
except ImportError:
    __version__ = "dev"
    __commit__ = "unknown"
    __build_date__ = "unknown"

# ------------------------------------------------------------
# Flask app
# ------------------------------------------------------------
app = Flask(__name__)

# ------------------------------------------------------------
# CONFIG (environment variables)
# ------------------------------------------------------------
MS_PORT = int(os.getenv("PORT", "5001"))
VERSION = "0.1"

# ------------------------------------------------------------
# STARTUP LOGGING
#   pdftoppm is a command-line tool that converts the pages
#   of a PDF file into images (such as PNG, JPG or PPM).
#   It is part of the poppler-utils package on Linux
# ------------------------------------------------------------
configure("INFO")

logger.info("-------------------------------------------------------------------------")
logger.info("Thumbnail Service started")
logger.info("-------------------------------------------------------------------------")
logger.info(" version     : %s", __version__)
logger.info(" commit      : %s", __commit__)
logger.info(" build_date  : %s", __build_date__)
logger.info(" --> PORT     : %d", MS_PORT)
logger.info("-------------------------------------------------------------------------")
logger.info(" pdftoppm (cmd tool PDF 2 Image): %s", shutil.which("pdftoppm"))
logger.info("-------------------------------------------------------------------------")


# ------------------------------------------------------------
# HEALTH CHECK
# ------------------------------------------------------------
@app.route("/health", methods=["GET"])
def health():
    """Simple health endpoint for orchestration / monitoring"""
    return jsonify({"status": "ok"}), 200


# ------------------------------------------------------------
# HEALTH CHECK for render.com
# https://thumbnail-tgzi.onrender.com/
# ------------------------------------------------------------
@app.route("/", methods=["GET"])
def get():
    return jsonify({"service": "thumbnail-service", "status": "running"}), 200


@app.route("/", methods=["HEAD"])
def head():
    return jsonify({"service": "thumbnail-service", "status": "running"}), 200


# ------------------------------------------------------------
# VERSION CHECK
# ------------------------------------------------------------
@app.route("/version", methods=["GET"])
def version():

    return jsonify(
        {
            "version": __version__,
            "commit": __commit__,
            "build_date": __build_date__,
        }
    ), 200


# ------------------------------------------------------------
# SET OR GET LOG
# ------------------------------------------------------------
@app.route("/loglevel", methods=["GET"])
def loglevel():
    # Retrieves 'log_level' from the URL /setlog?log_level=debug
    # If a 'log_level' is passed in the URL, we reconfigure it on the fly
    requested_level = request.args.get("log_level")
    if requested_level:
        configure(requested_level)

    return jsonify({"log_level": get_current_level()}), 200


# ------------------------------------------------------------
# THUMBNAIL GENERATION
#
# Supported formats:
# - PDF (first page)
# - PNG
# - JPG / JPEG
# - WEBP
#
# Requires:
# - input_path
# - output_path
# - max_size (optional, default=128)
#
#  curl -X POST http://localhost:5001/thumbnail \
#     -H "Content-Type: application/json" \
#      -d '{
#        "input_path": "/home/.../ballade.pdf",
#        "output_path": "/home/.../thumbnail_ballade.png",
#        "max_size": 256
#      }'
#
# ------------------------------------------------------------
@app.route("/thumbnail/create", methods=["POST"])
def create_thumbnail():
    # Generates a version 4 UUID (Universally Unique Identifier).
    # This is a 128-bit identifier generated entirely at random.
    # Converts this UUID to a string by removing all hyphens (-).
    # [:8]
    # Retrieves a slice of the first 8 characters of this string.
    # Final result: "c9bf9e57"

    request_id = uuid.uuid4().hex[:8]
    start = time.perf_counter()

    curLogLevel = get_current_level()

    # --------------------------------------------------------
    # Read JSON payload
    # --------------------------------------------------------
    data = request.get_json()

    if not data:
        return jsonify({"error": "missing JSON body"}), 400

    # log_level = data.get("log_level", "INFO").upper()
    log_level = data.get("log_level")
    if log_level:
        configure(log_level)
    else:
        configure(curLogLevel)

    input_path = data.get("input_path")
    output_path = data.get("output_path")
    if not input_path or not output_path:
        return jsonify({"error": "input_path and output_path required"}), 400

    max_size = int(data.get("max_size", 128))

    logger.debug("[%s] input=%s", request_id, input_path)
    logger.debug("[%s] output=%s", request_id, output_path)

    logger.info(
        "[%s] Thumbnail %s -> %s (%d)",
        request_id,
        os.path.basename(input_path),
        os.path.basename(output_path),
        max_size,
    )

    # --------------------------------------------------------
    # Validate inputs
    # --------------------------------------------------------
    if not input_path or not output_path:
        return jsonify({"error": "input_path and output_path required"}), 400

    if not os.path.exists(input_path):
        return jsonify({"error": f"Input file not found: {input_path}"}), 404

    try:
        ext = os.path.splitext(input_path)[1].lower()

        if ext == ".pdf":
            # ----------------------------------------------------
            # Convert PDF -> images (page 1 only)
            # ----------------------------------------------------
            images = convert_from_path(input_path, first_page=1, last_page=1)
            img = images[0]

        elif ext in [".png", ".jpg", ".jpeg", ".webp"]:
            # ----------------------------------------------------
            # Convert images
            # ----------------------------------------------------
            img = Image.open(input_path)

        else:
            return jsonify({"error": f"image extension not allowed: {ext}"}), 400

        # Resize by keeping the ratio
        img.thumbnail((max_size, max_size))

        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # ----------------------------------------------------
        # Save first page as PNG
        # ----------------------------------------------------
        img.save(output_path, "PNG", optimize=True)

        elapsed = (time.perf_counter() - start) * 1000

        logger.info(
            "[%s] Thumbnail generated in %.1f ms",
            request_id,
            elapsed,
        )

        return jsonify({"status": "success", "message": f"Saved to {output_path}"}), 200

    except (PDFPageCountError, PDFSyntaxError, UnidentifiedImageError, OSError) as e:
        logger.error("[%s] Thumbnail generation failed: %s", request_id, e)
        return jsonify({"error": str(e)}), 500


# ------------------------------------------------------------
# ENTRYPOINT (only for local dev, NOT used by gunicorn)
# ------------------------------------------------------------

if __name__ == "__main__":
    logger.info("Starting %s on port %d", "thumbnail-service", MS_PORT)
    app.run(host="0.0.0.0", port=MS_PORT, debug=False)
