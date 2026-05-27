from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt.exceptions import InvalidTokenError
from sqlmodel import Session

from app.db.database import get_session
from app.schemas.user import UserCreate, UserResponse, UserUpdate, UserLogin, Token
from app.services import user_srv
from app.core.exceptions import UserAlreadyExistsError, UserNotFoundError
from app.core.security import SECRET_KEY, ALGORITHM, create_access_token

# Esquema de autenticación OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/usuarios/login")

def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar el token de autenticación",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception
        
    user = user_srv.get_by_email(session, email)
    if user is None:
        raise credentials_exception
    return user

class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user = Depends(get_current_user)):
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos suficientes para realizar esta acción",
            )
        return current_user

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.get("/", response_model=list[UserResponse])
def user_list(session: Session = Depends(get_session)):
    return user_srv.get_all(session)


@router.get("/{id}", response_model=UserResponse)
def get_user(id: int, session: Session = Depends(get_session)):
    user = user_srv.get_by_id(session, id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )
    return user


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(usuario: UserCreate, session: Session = Depends(get_session)):
    try:
        return user_srv.create_user(session, usuario)
    except UserAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo ya está registrado",
        )


@router.put("/{id}", response_model=UserResponse)
def modify_user(id: int, user: UserCreate, session: Session = Depends(get_session)):
    try:
        return user_srv.update_user(session, id, user)
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )
    except UserAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo ya está registrado",
        )


@router.patch("/{id}", response_model=UserResponse)
def partial_modify_user(id: int, user: UserUpdate, session: Session = Depends(get_session)):
    try:
        return user_srv.update_user(session, id, user)
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )
    except UserAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo ya está registrado",
        )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    id: int, 
    session: Session = Depends(get_session),
    current_user = Depends(RoleChecker(["admin"]))
):
    if not user_srv.delete_user(session, id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )
    return None


@router.post("/login", response_model=Token, tags=["Auth"])
def login(credentials: UserLogin, session: Session = Depends(get_session)):
    user = user_srv.get_by_email(session, credentials.email)
    if not user or not user_srv.verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )
    access_token = create_access_token(
        data={"sub": user.email, "id": user.id, "role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer"}