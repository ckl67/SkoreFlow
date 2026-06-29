from flask import Flask, request, jsonify
from pdf2image import convert_from_path
import os
import logging
import sys
import shutil

# ------------------------------------------------------------
# Flask app
# ------------------------------------------------------------

app = Flask(__name__)

# ------------------------------------------------------------
# CONFIG (environment variables)
# ------------------------------------------------------------

MS_PORT = int(os.getenv("PORT", 5001))

# ------------------------------------------------------------
# LOGGING SETUP
# ------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
    stream=sys.stdout
)


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
def index():
    return jsonify({
        "service": "thumbnail-service",
        "status": "running"
    }), 200

@app.route("/", methods=["HEAD"])
def index():
    return jsonify({
        "service": "thumbnail-service",
        "status": "running"
    }), 200

# ------------------------------------------------------------
# THUMBNAIL GENERATION
# ------------------------------------------------------------

@app.route("/createthumbnail", methods=["POST"])
def create_thumbnail():
    """
    Convert first page of a PDF file into a PNG thumbnail.
    Requires:
        - pdf_path (absolute path)
        - output_path (absolute path)
    """

    # --------------------------------------------------------
    # Debug system dependency (optional but useful in prod logs)
    # --------------------------------------------------------
    logger.info("pdftoppm path = %s", shutil.which("pdftoppm"))
    logger.info("system PATH = %s", os.environ.get("PATH"))

    # --------------------------------------------------------
    # Read JSON payload
    # --------------------------------------------------------
    data = request.get_json()

    if not data:
        return jsonify({"error": "missing JSON body"}), 400

    pdf_path = data.get("pdf_path")
    output_path = data.get("output_path")

    # --------------------------------------------------------
    # Validate inputs
    # --------------------------------------------------------
    if not pdf_path or not output_path:
        return jsonify({"error": "pdf_path and output_path required"}), 400

    if not os.path.exists(pdf_path):
        return jsonify({"error": f"PDF not found: {pdf_path}"}), 404

    try:
        logger.info("Starting conversion for: %s", pdf_path)

        # ----------------------------------------------------
        # Convert PDF -> images (page 1 only)
        # ----------------------------------------------------
        images = convert_from_path(pdf_path, first_page=1, last_page=1)

        if not images:
            return jsonify({"error": "conversion failed"}), 500

        # ----------------------------------------------------
        # Ensure output directory exists
        # ----------------------------------------------------
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # ----------------------------------------------------
        # Save first page as PNG
        # ----------------------------------------------------
        images[0].save(output_path, "PNG")

        logger.info("Thumbnail generated: %s", output_path)

        return jsonify({
            "status": "success",
            "message": f"Saved to {output_path}"
        }), 200

    except Exception as e:
        logger.exception("Thumbnail generation failed")
        return jsonify({"error": str(e)}), 500


# ------------------------------------------------------------
# ENTRYPOINT (only for local dev, NOT used by gunicorn)
# ------------------------------------------------------------

if __name__ == "__main__":
    logger.info("Starting %s on port %d", "thumbnail-service", MS_PORT)
    app.run(host="0.0.0.0", port=MS_PORT, debug=False)
