from flask import Flask, request, jsonify
from pdf2image import convert_from_path
from PIL import Image
import os
import shutil
import time
import uuid
from logger import logger, configure

# ------------------------------------------------------------
# Flask app
# ------------------------------------------------------------
app = Flask(__name__)

# ------------------------------------------------------------
# CONFIG (environment variables)
# ------------------------------------------------------------
MS_PORT = int(os.getenv("PORT", 5001))


# ------------------------------------------------------------
# STARTUP LOGGING
# ------------------------------------------------------------
configure("INFO")

logger.info("----------------------------------------")
logger.info("Thumbnail Service started")
logger.info("pdftoppm : %s", shutil.which("pdftoppm"))
logger.info("PORT     : %d", MS_PORT)
logger.info("----------------------------------------")


# ------------------------------------------------------------
# HEALTH CHECK
# ------------------------------------------------------------
@app.route("/health", methods=["GET"])
def health():
    """Simple health endpoint for orchestration / monitoring"""
    return jsonify({"status": "ok"}), 200


# ------------------------------------------------------------
# HEALTH CHECK for render.com
# ------------------------------------------------------------


@app.route("/", methods=["GET"])
def get():
    return jsonify({"service": "thumbnail-service", "status": "running"}), 200


@app.route("/", methods=["HEAD"])
def head():
    return jsonify({"service": "thumbnail-service", "status": "running"}), 200


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
    """
    Convert first page of a PDF file into a PNG thumbnail.
    Requires:
        - input_path (absolute path)
        - output_path (absolute path)
        - max_size: 128
    """

    # Generates a version 4 UUID (Universally Unique Identifier).
    # This is a 128-bit identifier generated entirely at random.
    # Converts this UUID to a string by removing all hyphens (-).
    # [:8]
    # Retrieves a slice of the first 8 characters of this string.
    # Final result: "c9bf9e57"

    request_id = uuid.uuid4().hex[:8]

    start = time.perf_counter()

    # --------------------------------------------------------
    # Read JSON payload
    # --------------------------------------------------------
    data = request.get_json()

    if not data:
        return jsonify({"error": "missing JSON body"}), 400

    input_path = data.get("input_path")
    output_path = data.get("output_path")
    if not input_path or not output_path:
        return jsonify({"error": "input_path and output_path required"}), 400

    max_size = int(data.get("max_size", 128))
    log_level = data.get("log_level", "INFO").upper()

    configure(log_level)

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

    except Exception as e:
        logger.error("[%s] Thumbnail generation failed", request_id)
        return jsonify({"error": str(e)}), 500


# ------------------------------------------------------------
# ENTRYPOINT (only for local dev, NOT used by gunicorn)
# ------------------------------------------------------------

if __name__ == "__main__":
    logger.info("Starting %s on port %d", "thumbnail-service", MS_PORT)
    app.run(host="0.0.0.0", port=MS_PORT, debug=False)
