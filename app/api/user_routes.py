from fastapi import APIRouter, HTTPException, status
from app.schemas.user import UserCreate, UserResponse
from app.services import user_srv

# Centralizamos el prefijo y los tags para no repetirlos
router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

@router.get("/", response_model=list[UserResponse])
def user_list():
    return user_srv.get_all()

@router.get("/{id}", response_model=UserResponse)
def get_user(id: int):
    user = user_srv.get_by_id(id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return user

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(usuario: UserCreate):
    return user_srv.create_user(usuario)

@router.put("/{id}", response_model=UserResponse)
def modify_user(id: int, user: UserCreate):
    updated_user = user_srv.update_user(id, user)
    if not updated_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return updated_user

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(id: int):
    # La buena práctica en un DELETE exitoso es devolver 204 (Sin contenido)
    if not user_srv.delete_user(id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return None