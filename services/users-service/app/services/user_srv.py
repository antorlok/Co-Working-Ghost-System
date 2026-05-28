from sqlmodel import Session
from app.models.models import User
from app.schemas.user import UserCreate, UserUpdate
from app.repositories.user_repo import UserRepository
from app.core.security import hash_password, verify_password
from app.core.exceptions import UserNotFoundError

# El servicio ahora orquesta la lógica de negocio usando el repositorio, sin interactuar directo con la BD ni HTTP
def get_all(session: Session) -> list[User]:
    repo = UserRepository(session)
    return repo.get_all()

def get_by_id(session: Session, user_id: int) -> User | None:
    repo = UserRepository(session)
    return repo.get_by_id(user_id)

def get_by_email(session: Session, email: str) -> User | None:
    repo = UserRepository(session)
    return repo.get_by_email(email)

def create_user(session: Session, data: UserCreate) -> User:
    repo = UserRepository(session)
    new_user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
    )
    return repo.create(new_user)

def update_user(session: Session, user_id: int, data: UserUpdate | UserCreate) -> User:
    repo = UserRepository(session)
    user = repo.get_by_id(user_id)
    if not user:
        raise UserNotFoundError()

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "password":
            setattr(user, "password_hash", hash_password(value))
        else:
            setattr(user, key, value)

    return repo.update(user)

def delete_user(session: Session, user_id: int) -> bool:
    repo = UserRepository(session)
    user = repo.get_by_id(user_id)
    if not user:
        return False

    repo.delete(user)
    return True

# Exportamos explícitamente para seguir usando las funciones
# en rutas sin necesidad de instanciar clases ahí (para no cambiar las firmas del API dramáticamente)
__all__ = [
    "get_all", "get_by_id", "get_by_email", 
    "create_user", "update_user", "delete_user", "verify_password"
]