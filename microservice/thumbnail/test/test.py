import os
import sys
import requests

# ---------------------------------------------------------------------------------------
# Usage Steps
# ---------------------------------------------------------------------------------------
"""
1) Run the thumbnail-service :
./venv/bin/gunicorn app:app --bind 0.0.0.0:5001

2) Run the test script in another terminal:
./venv/bin/python test.py


curl -X POST http://localhost:5001/thumbnail/create \
     -H "Content-Type: application/json" \
      -d '{
        "input_path": "/home/christian/SkoreFlow_Project/SkoreFlow/microservice/thumbnail/test/storage/ballade.pdf",
        "output_path": "/home/christian/SkoreFlow_Project/SkoreFlow/microservice/thumbnail/test/storage/thumbnail_ballade.png",
        "max_size":256
      }'

curl -X POST http://localhost:5001/thumbnail/create \
     -H "Content-Type: application/json" \
      -d '{
        "input_path": "/home/christian/SkoreFlow_Project/SkoreFlow/microservice/thumbnail/test/storage/Mozart.png",
        "output_path": "/home/christian/SkoreFlow_Project/SkoreFlow/microservice/thumbnail/test/storage/thumbnail_Mozart_40.png",
        "max_size":40
      }'


"""
# ---------------------------------------------------------------------------------------

# -----------------------
# Configuration
# -----------------------
SERVICE_URL = "http://localhost:5001/thumbnail/create"

PDF_PATH = "/home/christian/SkoreFlow_Project/SkoreFlow/microservice/thumbnail/test/storage/ballade.pdf"
OUTPUT_PDF_PATH = "/home/christian/SkoreFlow_Project/SkoreFlow/microservice/thumbnail/test/storage/thumbnail_ballade.png"

IMAGE_PATH = "/home/christian/SkoreFlow_Project/SkoreFlow/microservice/thumbnail/test/storage/Mozart.png"
OUTPUT_IMAGE_PATH = "/home/christian/SkoreFlow_Project/SkoreFlow/microservice/thumbnail/test/storage/Mozart_40.png"

# -----------------------
# Pre-checks
# -----------------------
if not os.path.exists(PDF_PATH):
    print(f"❌ Source PDF not found: {PDF_PATH}")
    sys.exit(1)

if not os.path.exists(IMAGE_PATH):
    print(f"❌ Source Image not found: {IMAGE_PATH}")
    sys.exit(1)

# Remove existing outputs if they exist
for path in [OUTPUT_PDF_PATH, OUTPUT_IMAGE_PATH]:
    if os.path.exists(path):
        os.remove(path)

# -----------------------
# Payloads definition
# -----------------------
tasks = [
    {
        "name": "PDF Thumbnail",
        "payload": {
            "input_path": PDF_PATH,
            "output_path": OUTPUT_PDF_PATH,
            "max_size": 256,
        },
        "expected_output": OUTPUT_PDF_PATH,
    },
    {
        "name": "Image Thumbnail",
        "payload": {
            "input_path": IMAGE_PATH,
            "output_path": OUTPUT_IMAGE_PATH,
            "max_size": 40,
        },
        "expected_output": OUTPUT_IMAGE_PATH,
    },
]

# -----------------------
# Send Requests Loop
# -----------------------
for task in tasks:
    print(f"\n--- Testing: {task['name']} ---")
    try:
        response = requests.post(SERVICE_URL, json=task["payload"])
    except Exception as e:
        print(f"❌ Error connecting to service: {e}")
        sys.exit(1)

    if response.status_code == 200:
        print("✅ Service returned successfully:", response.json())
    else:
        print(f"❌ Service failed (status {response.status_code}):", response.text)
        sys.exit(1)

    # Verify generated file
    if os.path.exists(task["expected_output"]):
        print(f"✅ Thumbnail verified on disk: {task['expected_output']}")
    else:
        print(f"❌ File not found after execution: {task['expected_output']}")
