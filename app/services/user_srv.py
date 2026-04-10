from app.schemas.user import UserCreate

# Simulamos la base de datos en memoria (en el futuro esto será SQLAlchemy o similar)
users_db = [
    {"id": 1, "name": "Ana", "email": "ana@gmail.com", "password": "hash_temporal"},
    {"id": 2, "name": "Pedro", "email": "pedro@gmail.com", "password": "hash_temporal"},
]

def get_all() -> list[dict]:
    return users_db

def get_by_id(user_id: int) -> dict | None:
    # Busca el primer usuario que coincida, si no lo encuentra devuelve None
    return next((u for u in users_db if u["id"] == user_id), None)

def create_user(user: UserCreate) -> dict:
    # Calculamos el ID asegurando que no falle si la lista está vacía
    new_id = len(users_db) + 1 if users_db else 1
    
    new_user = {
        "id": new_id,
        "name": user.name,
        "email": user.email,
        "password": user.password # Pendiente: Encriptar esto más adelante
    }
    
    users_db.append(new_user)
    return new_user

def update_user(usuario_id: int, data: UserCreate) -> dict | None:
    user = get_by_id(usuario_id)
    if user:
        user["name"] = data.name
        user["email"] = data.email
        user["password"] = data.password
        return user
    return None

def delete_user(user_id: int) -> bool:
    user = get_by_id(user_id)
    if user:
        users_db.remove(user)
        return True
    return False