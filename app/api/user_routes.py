from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.db.database import get_session
from app.schemas.user import UserCreate, UserResponse, UserUpdate, UserLogin
from app.services import user_srv
from app.core.exceptions import UserAlreadyExistsError, UserNotFoundError

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
def delete_user(id: int, session: Session = Depends(get_session)):
    if not user_srv.delete_user(session, id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )
    return None


@router.post("/login", response_model=dict, tags=["Auth"])
def login(credentials: UserLogin, session: Session = Depends(get_session)):
    user = user_srv.get_by_email(session, credentials.email)
    if not user or not user_srv.verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )
    return {"message": "Login exitoso", "user_id": user.id}