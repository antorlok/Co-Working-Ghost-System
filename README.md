# Plataforma de Co-working - API de Usuarios (Monorepo)

Este repositorio contiene la arquitectura modular para la plataforma de Co-working y Reservación de Espacios. Actualmente implementa el módulo de **Usuarios, Roles y Autenticación con JWT** bajo principios de **Clean Architecture (Arquitectura Limpia)**.

---

## 🏛️ Estructura del Monorepo

```text
.
├── services/
│   └── users-service/    # Servicio de Usuarios en FastAPI (Python)
│       ├── app/          # Código fuente principal (Clean Architecture)
│       ├── alembic/      # Migraciones de base de datos
│       ├── tests/        # Pruebas unitarias de Pytest
│       └── Dockerfile    # Empaquetado Docker del servicio
├── arquitectura.md       # Explicación completa del diseño técnico
├── docker-compose.yml    # Orquestador local del ecosistema
└── README.md             # Guía de inicio rápido
```

---

## 🐳 Guía de Inicio Rápido con Docker (Recomendado)

La forma más rápida de iniciar el proyecto y tener tanto **PostgreSQL** como la **API de Usuarios** funcionando juntos es utilizando **Docker Compose**.

### Prerrequisitos
* Tener instalado **Docker** y **Docker Compose**.

### Instrucciones de Inicio

1. **Clona el repositorio** y colócate en la raíz del proyecto.
2. **Levanta todo el ecosistema** ejecutando:
   ```bash
   docker-compose up --build
   ```

**¿Qué hace este comando automáticamente?**
* Descarga e inicia un contenedor con **PostgreSQL 15** en el puerto `5432` con volumen persistente (tus datos no se borran al apagar).
* Compila la imagen de **FastAPI** (`users-service`) y la expone en el puerto `8000`.
* Ejecuta automáticamente todas las migraciones de base de datos pendientes (`alembic upgrade head`) para crear y estructurar las tablas en PostgreSQL.
* Inicia el servidor de FastAPI listo para recibir peticiones.

---

## 🛠️ Guía de Desarrollo Local (Sin Docker para la API)

Si prefieres correr la base de datos en Docker pero programar y debuggear tu API de FastAPI directamente en tu entorno local:

### 1. Inicia solo PostgreSQL en Docker
```bash
docker run --name local-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=coworking_db \
  -p 5432:5432 \
  -d postgres:15
```

### 2. Configura tu Entorno de Python
```bash
cd services/users-service

# Crea y activa el entorno virtual
python3 -m venv .venv
source .venv/bin/activate

# Instala todas las dependencias
pip install -r requirements.txt
```

### 3. Aplica las Migraciones de la Base de Datos
```bash
alembic upgrade head
```

### 4. Inicia el Servidor de Desarrollo
```bash
uvicorn app.main:app --reload
```

---

## 🚀 Probar la API y su Documentación

Una vez levantado el servidor (sea con Docker Compose o localmente):

1. Abre tu navegador e ingresa a la documentación interactiva:
   👉 **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
2. Crea un usuario con el endpoint `POST /usuarios/`.
3. Inicia sesión con el endpoint `POST /usuarios/login` y obtén tu Token JWT seguro para autorizar las peticiones protegidas.

---

## 🧪 Pruebas Unitarias
El proyecto cuenta con un conjunto robusto de pruebas automatizadas que utilizan una base de datos en memoria sumamente veloz para no interferir con tu base de datos de desarrollo.

Para ejecutarlas:
```bash
cd services/users-service
source .venv/bin/activate
pytest tests/
```
