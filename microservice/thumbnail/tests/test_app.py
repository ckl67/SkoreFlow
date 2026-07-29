# Sometimes you need to
#   Open the command palette:
#   Type ‘Python: Restart Language Server’ and press Enter.

import sys

sys.path.append("src")
import os

import pytest
from my_app.app import app

# ------------------------------------------------------------
# Dynamic test directories resolution
# ------------------------------------------------------------
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
STORAGE_DIR = os.path.join(TEST_DIR, "storage")

PDF_PATH = os.path.join(STORAGE_DIR, "ballade.pdf")
IMAGE_PATH = os.path.join(STORAGE_DIR, "Mozart.png")


# ------------------------------------------------------------
# FIXTURES
# ------------------------------------------------------------
@pytest.fixture
def client():
    """Flask virtual test client to simulate HTTP requests without starting the server."""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


# ------------------------------------------------------------
# BASE ENDPOINT TESTS
# ------------------------------------------------------------
def test_health_endpoint(client):
    """Verify that the /health endpoint returns 200 OK and version metadata."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "ok"


def test_version_endpoint(client):
    """Verify the /version endpoint."""
    response = client.get("/version")
    assert response.status_code == 200
    data = response.get_json()
    assert "version" in data
    assert "commit" in data
    assert "build_date" in data


# ------------------------------------------------------------
# LOG LEVEL ENDPOINT TESTS
# ------------------------------------------------------------
def test_loglevel_get_current(client):
    """Verify getting the current log level without changing it."""
    response = client.get("/loglevel")
    assert response.status_code == 200
    data = response.get_json()
    assert "log_level" in data


def test_loglevel_change_on_the_fly(client):
    """Verify changing the log level via query parameter."""
    response_info = client.get("/loglevel?log_level=info")
    assert response_info.status_code == 200
    assert response_info.get_json()["log_level"] == "INFO"

    response_debug = client.get("/loglevel?log_level=debug")
    assert response_debug.status_code == 200
    assert response_debug.get_json()["log_level"] == "DEBUG"


# ------------------------------------------------------------
# THUMBNAIL GENERATION TESTS
# ------------------------------------------------------------
def test_create_pdf_thumbnail(client, tmp_path):
    """Test generating a thumbnail from a PDF file."""
    # tmp_path is a built-in pytest fixture providing a temporary directory
    output_path = tmp_path / "thumbnail_ballade.png"

    payload = {
        "input_path": PDF_PATH,
        "output_path": str(output_path),
        "max_size": 256,
    }

    response = client.post("/thumbnail/create", json=payload)

    # 1. Validate HTTP response
    assert response.status_code == 200
    assert response.get_json()["status"] == "success"

    # 2. Verify image file was written to disk and is not empty
    assert os.path.exists(output_path)
    assert os.path.getsize(output_path) > 0


def test_create_image_thumbnail(client, tmp_path):
    """Test generating a thumbnail from an image file (PNG)."""
    output_path = tmp_path / "Mozart_40.png"

    payload = {
        "input_path": IMAGE_PATH,
        "output_path": str(output_path),
        "max_size": 40,
    }

    response = client.post("/thumbnail/create", json=payload)

    assert response.status_code == 200
    assert response.get_json()["status"] == "success"
    assert os.path.exists(output_path)
    assert os.path.getsize(output_path) > 0


# ------------------------------------------------------------
# ERROR HANDLING TESTS
# ------------------------------------------------------------
def test_create_thumbnail_missing_input(client):
    """Verify HTTP 400 Bad Request when JSON body is missing."""
    response = client.post("/thumbnail/create")
    assert response.status_code == 415


def test_create_thumbnail_file_not_found(client, tmp_path):
    """Verify HTTP 404 Not Found when the source file does not exist."""
    payload = {
        "input_path": "/invalid/path/file.pdf",
        "output_path": str(tmp_path / "out.png"),
    }
    response = client.post("/thumbnail/create", json=payload)
    assert response.status_code == 404
