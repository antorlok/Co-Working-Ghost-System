FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema necesarias (por ejemplo, para psycopg2 si se compila, aunque psycopg2-binary usualmente no requiere build-essential)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente de la aplicación
COPY . .

# Exponer el puerto por defecto de FastAPI
EXPOSE 8000

# Comando para ejecutar migraciones y levantar el servidor
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
