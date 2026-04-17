# API de Usuarios - Arquitectura Limpia (Clean Architecture)

Este proyecto implementa una API RESTful para la gestión de usuarios utilizando **FastAPI**, **SQLModel**, y **PostgreSQL**. La aplicación sigue los principios de **Clean Architecture** (Arquitectura Limpia) y el patrón de **Capas**, separando responsabilidades para que el código sea modular, mantenible y altamente escalable.

## Estructura del Proyecto

```text
.
├── alembic/              # Configuración y scripts de migración de base de datos
├── app/                  # Código fuente principal de la aplicación
│   ├── api/              # Capa de Controladores (Rutas/Endpoints)
│   ├── core/             # Capa Transversal (Configuración, Seguridad, Excepciones)
│   ├── db/               # Capa de Infraestructura (Conexión a BD)
│   ├── models/           # Capa de Dominio (Modelos ORM)
│   ├── repositories/     # Capa de Acceso a Datos (Patrón Repositorio)
│   ├── schemas/          # Capa de Transferencia de Datos (DTOs / Pydantic)
│   ├── services/         # Capa de Aplicación (Lógica de Negocio / Casos de Uso)
│   └── main.py           # Punto de entrada principal de la aplicación FastAPI
├── tests/                # Pruebas automatizadas (Pytest)
├── alembic.ini           # Configuración de la herramienta Alembic
├── requirements.txt      # Dependencias del proyecto
└── .env.example          # Plantilla de variables de entorno
```

## Explicación de las Capas y Archivos

### 1. `app/api/` (Controladores)
**Archivo clave:** `user_routes.py`
- **Responsabilidad:** Gestiona las peticiones HTTP de entrada y las respuestas de salida. Es el puente entre el exterior (el cliente web) y el núcleo de la aplicación. No contiene lógica de negocio.
- **Qué hace:** Define y expone los endpoints HTTP (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`). Atrapa los errores de negocio (ej. `UserNotFoundError`) emitidos por el Servicio y los transforma en respuestas HTTP válidas (como `404 Not Found` o `409 Conflict`).

### 2. `app/core/` (Capa Transversal)
**Archivos clave:** `exceptions.py`, `security.py`
- **Responsabilidad:** Proporcionar utilidades e infraestructuras transversales que pueden ser utilizadas por cualquier otra capa.
- **`exceptions.py`:** Define excepciones personalizadas puras del dominio (ej. `UserAlreadyExistsError`). Esto evita que la capa de Servicios y Repositorios dependan de `HTTPException` de FastAPI, permitiendo reutilizar el código en contextos fuera de la web (como procesos en segundo plano).
- **`security.py`:** Aísla la lógica de criptografía. Se encarga de generar los hash de las contraseñas y verificarlas usando la librería `passlib`.

### 3. `app/db/` (Infraestructura)
**Archivo clave:** `database.py`
- **Responsabilidad:** Configurar y manejar la conexión directa con el motor de base de datos subyacente.
- **Qué hace:** Crea el `Engine` de base de datos leyendo las variables de entorno (`DATABASE_URL`) y provee el generador `get_session` para inyectar transacciones seguras de base de datos en las peticiones.

### 4. `app/models/` (Dominio)
**Archivo clave:** `models.py`
- **Responsabilidad:** Representar las entidades centrales del negocio y dictar la estructura estricta de las tablas en la base de datos.
- **Qué hace:** Define la clase `User` heredando de `SQLModel`, configurando los nombres de las columnas, longitudes máximas, obligatoriedad y reglas únicas (ej. `email` no se puede repetir).

### 5. `app/repositories/` (Acceso a Datos)
**Archivo clave:** `user_repo.py`
- **Responsabilidad:** Aislar por completo las operaciones directas contra la base de datos (consultas SQL) del resto de la aplicación.
- **Qué hace:** Centraliza las llamadas a `session.add`, `session.commit` y `session.exec`. En caso de que ocurra un error de integridad de PostgreSQL (como intentar registrar un correo repetido), lo atrapa y dispara una excepción amigable del dominio (`UserAlreadyExistsError`).

### 6. `app/schemas/` (Data Transfer Objects - DTOs)
**Archivo clave:** `user.py`
- **Responsabilidad:** Definir las reglas de cómo la información entra y sale del sistema. Funciona como un filtro de validación de seguridad.
- **Qué hace:** Usa `Pydantic` para garantizar que la información sea correcta antes de que siquiera toque los servicios.
  - `UserCreate`: Exige una contraseña fuerte (mayúsculas, minúsculas, números, símbolos).
  - `UserUpdate`: Define todos los campos como opcionales para permitir actualizaciones parciales.
  - `UserLogin`: Pide estrictamente email y contraseña.
  - `UserResponse`: Se asegura de **nunca** exponer los campos `password` o `password_hash` al exterior.

### 7. `app/services/` (Lógica de Negocio / Casos de Uso)
**Archivo clave:** `user_srv.py`
- **Responsabilidad:** Ejecutar las reglas operativas de la aplicación. Coordina el flujo de datos entre los Schemas (entrada), los Repositorios (almacenamiento) y el Core (seguridad).
- **Qué hace:** Cuando se le pide crear un usuario, toma la contraseña plana, llama a `hash_password`, empaca los datos, llama al `UserRepository` para guardarlo y devuelve el resultado. No maneja peticiones HTTP.

---

## Casos de Uso (Use Cases) Implementados

1. **Gestión de Usuarios (CRUD):**
   - **Alta (Registro):** Validación de datos de entrada estructurados. Generación automática de encriptación de claves antes del guardado persistente.
   - **Consulta:** Búsqueda y listado de usuarios mapeados al esquema de salida seguro (sin contraseñas).
   - **Edición Completa (PUT):** Sobreescritura total de los datos de un usuario existente.
   - **Edición Parcial (PATCH):** Detección de los campos enviados por el cliente y actualización dinámica unicamente de la información provista, dejando el resto intacto.
   - **Baja (Eliminación):** Borrado físico en base de datos.

2. **Autenticación Básica (Login):**
   - Validación cruzada entre un email provisto y un usuario existente. Si existe, se recupera el hash criptográfico interno y se coteja (match) de forma segura con la contraseña plana recibida. Devuelve error `401` en caso de fallar o un mensaje de éxito en caso positivo.

3. **Prevención de Conflictos de Estado:**
   - Si se detectan correos duplicados en las operaciones de Registro o Edición, la base de datos lanza un `IntegrityError`. El sistema revierte la transacción (`rollback`) para evitar bloqueos y emite controladamente un `409 Conflict`.
