from pydantic import BaseModel, EmailStr, Field

# 1. Base: Lo que es común para cualquier operación con usuarios
class UserBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=50, description="User full name")
    email: EmailStr # Requiere: pip install "pydantic[email]"

# 2. Entrada: Lo que pedimos al momento de CREAR o ACTUALIZAR un usuario
class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Mínimo 8 caracteres para la contraseña")

# 3. Salida: Lo que RESPONDEMOS al cliente (Fíjate que NO incluimos la contraseña)
class UserResponse(UserBase):
    id: int

    class Config:
        # Permite a Pydantic leer datos directamente de diccionarios u ORMs de bases de datos
        from_attributes = True