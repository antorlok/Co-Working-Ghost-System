import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
from pydantic import ValidationError

from app.main import app
from app.db.database import get_session
from app.services.user_srv import hash_password, verify_password
from app.schemas.user import UserCreate

# Test DB Setup
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

def get_session_override():
    with Session(engine) as session:
        yield session

app.dependency_overrides[get_session] = get_session_override
client = TestClient(app)

@pytest.fixture(name="session")
def session_fixture():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)

def test_schema_validation():
    with pytest.raises(ValidationError):
        UserCreate(name="Jo", email="invalid", password="123")  # min length 3, invalid email, weak password

def test_hash_password():
    pwd = "SecurePassword123!"
    hashed = hash_password(pwd)
    assert pwd != hashed
    assert verify_password(pwd, hashed)

def test_crud_and_exposure(session):
    # Create a member user
    user_data = {"name": "Test User", "email": "test@example.com", "password": "StrongPassword1!", "role": "member"}
    response = client.post("/usuarios/", json=user_data)
    assert response.status_code == 201
    data = response.json()
    assert "password" not in data
    assert "password_hash" not in data
    assert data["email"] == "test@example.com"
    assert data["role"] == "member"
    user_id = data["id"]

    # Read
    response = client.get(f"/usuarios/{user_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Test User"

    # Update (Patch)
    response = client.patch(f"/usuarios/{user_id}", json={"name": "Updated User"})
    assert response.status_code == 200
    assert response.json()["name"] == "Updated User"

    # Login as member
    response = client.post("/usuarios/login", json={"email": "test@example.com", "password": "StrongPassword1!"})
    assert response.status_code == 200
    login_data = response.json()
    assert "access_token" in login_data
    assert login_data["token_type"] == "bearer"
    member_token = login_data["access_token"]

    # Try to delete without token (should fail with 401)
    response = client.delete(f"/usuarios/{user_id}")
    assert response.status_code == 401

    # Try to delete with member token (should fail with 403 because only admin is allowed)
    response = client.delete(f"/usuarios/{user_id}", headers={"Authorization": f"Bearer {member_token}"})
    assert response.status_code == 403

    # Register an admin user
    admin_data = {"name": "Admin User", "email": "admin@example.com", "password": "StrongPassword1!", "role": "admin"}
    response = client.post("/usuarios/", json=admin_data)
    assert response.status_code == 201
    
    # Login as admin
    response = client.post("/usuarios/login", json={"email": "admin@example.com", "password": "StrongPassword1!"})
    assert response.status_code == 200
    admin_token = response.json()["access_token"]

    # Delete with admin token (should succeed with 204)
    response = client.delete(f"/usuarios/{user_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 204
    
    # Verify Delete
    response = client.get(f"/usuarios/{user_id}")
    assert response.status_code == 404

