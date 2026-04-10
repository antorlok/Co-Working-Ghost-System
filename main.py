from fastapi import FastAPI
from app.api.user_routes import router as user_routes

app = FastAPI(
    title="API de Usuarios Modular",
    description="API refactorizada implementando Clean Architecture",
    version="1.0.0"
)

# Conectamos las rutas modulares a la aplicación principal
app.include_router(user_routes)

@app.get("/", tags=["Estado"])
def health_check():
    return {"mensaje": "La API modular está en línea y funcionando"}