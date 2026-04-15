import requests
import os
import sys


# -----------------------
# Usage Steps
# -----------------------
# Activate your virtual environment:
# source venv/bin/activate
# Start the thumbnail service:
# python3 app.py
# -----------------------
# Run the test script in another terminal:
# python test_thumbnail.py
# -----------------------


# -----------------------
# Configuration
# -----------------------
SERVICE_URL = "http://localhost:5001/createthumbnail"
PDF_PATH = "/home/christian/skoreflow/backend/micro-service/thumbnail-service/test/storage/ballade.pdf"
OUTPUT_PATH = "/home/christian/skoreflow/backend/micro-service/thumbnail-service/test/storage/thumbnail_ballade.png"

# -----------------------
# Pre-checks
# -----------------------
# Check if the source PDF exists
if not os.path.exists(PDF_PATH):
    print(f"❌ Source PDF not found: {PDF_PATH}")
    sys.exit(1)

# Remove existing thumbnail if it exists
if os.path.exists(OUTPUT_PATH):
    os.remove(OUTPUT_PATH)

# -----------------------
# Send the request
# -----------------------
payload = {
    "pdf_path": PDF_PATH,
    "output_path": OUTPUT_PATH,
    "log_level": "DEBUG"
}

# curl -X POST http://localhost:5010/createthumbnail \
#     -H "Content-Type: application/json" \
#     -d '{
#       "pdf_path": "/home/.../ballade.pdf",
#       "output_path": "/home/.../thumbnail_ballade.png"
#     }'

try:
    response = requests.post(SERVICE_URL, json=payload)
except Exception as e:
    print(f"❌ Error while calling the service: {e}")
    sys.exit(1)

# -----------------------
# JSON Response
# -----------------------
if response.status_code == 200:
    print("✅ Service returned successfully:", response.json())
else:
    print(f"❌ Service failed (status {response.status_code}):", response.json())
    sys.exit(1)

# -----------------------
# Verify the generated file
# -----------------------
if os.path.exists(OUTPUT_PATH):
    print(f"✅ Thumbnail generated: {OUTPUT_PATH}")
else:
    print(f"❌ Thumbnail not found after execution")
