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
# - This service acts as a stateless worker
# - It is triggered by the backend (Go service)
# - It does NOT contain business logic
# - It operates only on filesystem + transformation
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

# LOGGER CONFIGURATION
# - Default level: DEBUG (to capture startup and early issues)
# - Output: stdout (container-friendly)
# - Format: timestamp + level + service name + message
logging.basicConfig(
    format='%(asctime)s [%(levelname)s] [%(name)s] %(message)s',
    stream=sys.stdout
)

logger = logging.getLogger("ThumbnailWorker")
logger.setLevel(logging.DEBUG)

MS_NAME = os.getenv('MS_NAME', 'ThumbnailWorker')
MS_PORT = int(os.getenv('MS_PORT', 5001))

# ROUTE: /createthumbnail
# Handles PDF → PNG conversion requests.
# FLOW:
# 1. Parse JSON payload
# 2. Dynamically adjust log level (controlled by caller)
# 3. Validate file existence
# 4. Convert first page of PDF to PNG
# 5. Save result to disk
# 6. Return structured JSON response
#
# ERROR HANDLING:
# - 400 → invalid/missing payload
# - 404 → source file not found
# - 500 → processing failure
@app.route('/createthumbnail', methods=['POST'])
def create_thumbnail():
    data = request.get_json()

    # 1. Input validation
    if not data:
        logger.error("Request received without JSON payload")
        return jsonify({"error": "No JSON data provided"}), 400

    # 2. Dynamic log level control (driven by Go backend)
    # Example values: DEBUG, INFO, WARNING, ERROR
    log_level_str = data.get('log_level', 'INFO').upper()

    # Convert string → logging constant (fallback to INFO)
    numeric_level = getattr(logging, log_level_str, logging.INFO)
    logger.setLevel(numeric_level)

    # 3. Extract parameters
    pdf_path = data.get('pdf_path')
    output_path = data.get('output_path')

    logger.debug(f"Log level set dynamically: {log_level_str}")
    logger.debug(f"Conversion request: {pdf_path} -> {output_path}")

    # 4. File existence check
    if not os.path.exists(pdf_path):
        logger.error(f"Source PDF not found: {pdf_path}")
        return jsonify({"error": f"Source file not found: {pdf_path}"}), 404

    try:
        # 5. PDF → Image conversion (first page only)
        logger.info(f"Starting pdf2image conversion for {os.path.basename(pdf_path)}")

        images = convert_from_path(pdf_path, first_page=1, last_page=1)

        if images:
            # Ensure destination directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)

            # Save first page as PNG
            images[0].save(output_path, 'PNG')

            logger.info(f"Thumbnail successfully generated: {output_path}")

            return jsonify({
                "status": "success",
                "message": f"Saved to {output_path}"
            }), 200

        # No image generated (unexpected case)
        logger.error("Conversion failed: no image generated")
        return jsonify({"error": "Failed to convert"}), 500

    except Exception as e:
        # 6. Critical error handling (full stacktrace)
        logger.error(f"Critical error during conversion: {str(e)}", exc_info=True)

        return jsonify({"error": str(e)}), 500


# APPLICATION ENTRYPOINT
# Starts the Flask worker service.
# Designed to run inside a container or as a side-service.
if __name__ == '__main__':
    logger.info(f"Starting service {MS_NAME} on port {MS_PORT}...")
    app.run(host='0.0.0.0', port=MS_PORT)
