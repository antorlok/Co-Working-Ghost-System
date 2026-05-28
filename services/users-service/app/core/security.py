from datetime import datetime, timedelta, timezone
import jwt
from passlib.context import CryptContext

# Mover la logica de criptografia al core para separar responsabilidades del servicio (SRP)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuración de JWT (en producción se leerían de variables de entorno)
SECRET_KEY = "coworking_secret_key_change_me_in_prod"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def hash_password(raw_password: str) -> str:
    return pwd_context.hash(raw_password)

def verify_password(raw_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(raw_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

