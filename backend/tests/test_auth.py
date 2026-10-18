import pytest
from fastapi.testclient import TestClient
from app.main import app, init_db
from app.core.security import verify_password, get_password_hash

# Ensure tables and initial seeds exist for test run
init_db()

client = TestClient(app)

def test_password_hashing():
    raw = "ResearchScholar2026!"
    hashed = get_password_hash(raw)
    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_register_and_login():
    import uuid
    rand_email = f"user_{uuid.uuid4().hex[:6]}@docmind.ai"
    reg_payload = {
        "email": rand_email,
        "password": "SecurePassword123",
        "full_name": "Test Researcher"
    }

    # Register
    res_reg = client.post("/api/auth/register", json=reg_payload)
    assert res_reg.status_code == 200
    reg_data = res_reg.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == rand_email
    assert reg_data["user"]["full_name"] == "Test Researcher"

    # Duplicate registration should fail
    res_dup = client.post("/api/auth/register", json=reg_payload)
    assert res_dup.status_code == 400

    # Login
    res_login = client.post("/api/auth/login", json={"email": rand_email, "password": "SecurePassword123"})
    assert res_login.status_code == 200
    login_data = res_login.json()
    assert "access_token" in login_data

    # Login with bad password
    res_bad = client.post("/api/auth/login", json={"email": rand_email, "password": "WrongPassword"})
    assert res_bad.status_code == 401

def test_demo_user_seeded():
    res = client.post("/api/auth/login", json={"email": "demo@docmind.ai", "password": "password123"})
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["email"] == "demo@docmind.ai"
