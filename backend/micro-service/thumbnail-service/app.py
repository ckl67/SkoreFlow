# ===============================================================================================
# APPLICATION ARCHITECTURE - WORKER / INFRASTRUCTURE SERVICE
# ===============================================================================================
# Layer              | Component            | Responsibility
# -------------------|----------------------|--------------------------------------------------------
# INFRASTRUCTURE     | thumbnail worker     | 1. Expose HTTP endpoint for PDF → PNG conversion
#                    | (Flask service)      | 2. Handle file system operations (read/write)
#                    |                      | 3. Execute pdf2image processing
#                    |                      | 4. Provide structured logging (externally controlled)
#
# ROLE:
# - Stateless worker
# - Triggered by backend (Go service)
# - No business logic
# - Filesystem + transformation only
#
# INPUT:
# - pdf_path     → absolute path of source PDF
# - output_path  → absolute path for generated PNG
# - log_level    → dynamic logging level (optional)
#
# OUTPUT:
# - JSON response with status + message or error
# ===============================================================================================

from flask import Flask, request, jsonify
from pdf2image import convert_from_path
import os
import logging
import sys

app = Flask(__name__)

# ----------------------------------------------------------------
# ENV CONFIG
# ----------------------------------------------------------------
MS_NAME = os.getenv('MS_NAME', 'ThumbnailWorker')
MS_PORT = int(os.getenv('MS_PORT', 5001))

# ----------------------------------------------------------------
# LOGGER CONFIGURATION
# ----------------------------------------------------------------
logging.basicConfig(
    format='%(asctime)s [%(levelname)s] [%(name)s] %(message)s',
    stream=sys.stdout
)

logger = logging.getLogger(MS_NAME)
logger.setLevel(logging.DEBUG)

# ----------------------------------------------------------------
# BANNER
# ----------------------------------------------------------------
def print_banner():
    logger.info(
        f"""
[BOOT] ------------------------------------------
[BOOT] Service : {MS_NAME}
[BOOT] Port    : {MS_PORT}
[BOOT] PID     : {os.getpid()}
[BOOT] ------------------------------------------
"""
    )

# ----------------------------------------------------------------
# ROUTE: /createthumbnail
# ----------------------------------------------------------------
@app.route('/createthumbnail', methods=['POST'])
def create_thumbnail():
    data = request.get_json()

    # 1. Input validation
    if not data:
        logger.error("Request received without JSON payload")
        return jsonify({"error": "No JSON data provided"}), 400

    # 2. Dynamic log level
    log_level_str = data.get('log_level', 'INFO').upper()
    numeric_level = getattr(logging, log_level_str, logging.INFO)
    logger.setLevel(numeric_level)

    # 3. Extract parameters
    pdf_path = data.get('pdf_path')
    output_path = data.get('output_path')

    if not pdf_path or not output_path:
        logger.error("Missing required parameters: pdf_path or output_path")
        return jsonify({"error": "Missing pdf_path or output_path"}), 400

    # 4. File existence check
    if not os.path.exists(pdf_path):
        logger.error(f"Source PDF not found: {pdf_path}")
        return jsonify({"error": f"Source file not found: {pdf_path}"}), 404

    try:
        # 5. Conversion
        logger.info(f"Starting conversion: {os.path.basename(pdf_path)}")

        images = convert_from_path(pdf_path, first_page=1, last_page=1)

        if not images:
            logger.error("Conversion failed: no image generated")
            return jsonify({"error": "Failed to convert"}), 500

        # Ensure destination directory exists
        output_dir = os.path.dirname(output_path)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)

        # Save image
        images[0].save(output_path, 'PNG')

        logger.info(f"Thumbnail generated: {output_path}")

        return jsonify({
            "status": "success",
            "message": f"Saved to {output_path}"
        }), 200

    except Exception as e:
        logger.error("Critical error during conversion", exc_info=True)
        return jsonify({"error": str(e)}), 500


# ----------------------------------------------------------------
# ENTRYPOINT
# ----------------------------------------------------------------
if __name__ == "__main__":
    # Avoid double execution with Flask reloader
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true" or not app.debug:
        print_banner()

    app.run(host="0.0.0.0", port=MS_PORT, debug=False)
