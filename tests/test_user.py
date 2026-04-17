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
    # Create
    user_data = {"name": "Test User", "email": "test@example.com", "password": "StrongPassword1!"}
    response = client.post("/usuarios/", json=user_data)
    assert response.status_code == 201
    data = response.json()
    assert "password" not in data
    assert "password_hash" not in data
    assert data["email"] == "test@example.com"
    user_id = data["id"]

    # Read
    response = client.get(f"/usuarios/{user_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Test User"

    # Update (Patch)
    response = client.patch(f"/usuarios/{user_id}", json={"name": "Updated User"})
    assert response.status_code == 200
    assert response.json()["name"] == "Updated User"

    # Login
    response = client.post("/usuarios/login", json={"email": "test@example.com", "password": "StrongPassword1!"})
    assert response.status_code == 200
    assert response.json()["message"] == "Login exitoso"

    # Delete
    response = client.delete(f"/usuarios/{user_id}")
    assert response.status_code == 204
    
    # Verify Delete
    response = client.get(f"/usuarios/{user_id}")
    assert response.status_code == 404
