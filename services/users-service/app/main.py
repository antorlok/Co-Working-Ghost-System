from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.api.user_routes import router as user_routes

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ya no dependemos de create_all(), usamos Alembic.
    yield

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="API de Usuarios Modular",
    description="API refactorizada implementando Clean Architecture",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_routes)

@app.get("/", tags=["Estado"])
def health_check():
    return {"mensaje": "La API modular está en línea y funcionando"}


