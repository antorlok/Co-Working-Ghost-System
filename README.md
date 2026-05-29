# 🏢 Plataforma de Co-working - Arquitectura de Microservicios & Frontend Premium

Este repositorio contiene la arquitectura modular y distribuida para la plataforma de Co-working y Reservación de Espacios. Se compone de un frontend interactivo moderno y cuatro microservicios principales interconectados mediante una base de datos PostgreSQL compartida y validación criptográfica de Tokens JWT.

---

## 🏛️ Estructura del Monorepo

```text
.
├── frontend/                  # 💻 Next.js (App Router) - Puerto 3000
│                              # Interfaz interactiva en Cosmic Dark con Glassmorphism.
│
├── services/
│   ├── users-service/         # 🔐 FastAPI (Python) - Puerto 8000
│   │                          # Gestión de usuarios, roles (admin/member) y JWT.
│   │
│   ├── space-service/         # 🏢 Go / Gin / GORM - Puerto 8081
│   │                          # CRUD de espacios de co-working con Soft Deletes.
│   │
│   ├── reservations-service/  # 📅 Axum (Rust) - Puerto 8003
│   │                          # Motor de reservas y cola de confirmación.
│   │
│   └── billing-service/       # 🧾 Express.js (Node.js) - Puerto 8082
│                              # Facturación, cálculo automático de reportes e ingresos.
│
├── docker-compose.yml         # 🐳 Orquestador local multi-contenedor
└── README.md                  # 📖 Guía de inicio rápido e integración
```

---

## ⚡ Especificación de Microservicios

### 1. 🔐 Servicio de Usuarios (`users-service`)
* **Tecnología**: Python 3.10 / FastAPI / SQLAlchemy / Alembic / Pytest.
* **Puerto**: `8000`
* **Responsabilidad**:
  * Autenticación segura mediante tokens **JWT** (algoritmo HS256, firma compartida).
  * Control de acceso basado en roles (`admin` vs `member`).
  * Registro y gestión de perfiles de usuario.
* **Documentación Interactiva**: [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI)

### 2. 🏢 Servicio de Espacios (`space-service`)
* **Tecnología**: Go (Golang) / Gin Web Framework / GORM.
* **Puerto**: `8081`
* **Responsabilidad**:
  * Catálogo de espacios de coworking (salas de juntas, escritorios, oficinas privadas).
  * Soporte nativo para Soft Deletes (`deleted_at` vía GORM).
  * Auto-migración automática de esquemas al arrancar.
* **Endpoints Clave**:
  * `GET /spaces` - Listar espacios activos.
  * `POST /spaces` - Crear espacio (Requiere cabecera `Authorization: Bearer <JWT>` con rol `admin`).
  * `DELETE /spaces/:id` - Eliminación lógica de espacio (Requiere rol `admin`).

### 3. 📅 Servicio de Reservas (`reservations-service`)
* **Tecnología**: Rust / Axum / SQLx (Postgres) / Tokio / Validator.
* **Puerto**: `8003`
* **Responsabilidad**:
  * Motor de creación, consulta y cancelación de reservas.
  * Implementación de una cola de confirmación para gestionar turnos y solapamientos en espacios de alta demanda.
  * Validación criptográfica de claims JWT en Rust.
* **Endpoints Clave**:
  * `POST /reservas` - Crear una reserva (Requiere token JWT).
  * `GET /reservas/mis-reservas` - Listar reservas del usuario autenticado.
  * `DELETE /reservas/{id}` - Cancelar una reserva.
  * `GET /cola` - Ver el estado de la cola de confirmación (Requiere rol `admin`).
  * `POST /cola/confirmar` - Confirmar la siguiente reserva en la cola (Requiere rol `admin`).

### 4. 🧾 Servicio de Facturación y Reportes (`billing-service`)
* **Tecnología**: Node.js / Express.js / `pg` (PostgreSQL Client Pool).
* **Puerto**: `8082`
* **Responsabilidad**:
  * Generación y registro de facturas asociadas a reservas (`invoices`).
  * Consultas rápidas y agregación eficiente con complejidad $O(N)$ para reportes financieros y de uso.
  * Inicialización automática del esquema de tablas de facturación.
* **Endpoints Clave**:
  * `POST /billing/invoice` - Crear nueva factura.
  * `GET /billing/invoices` - Listar todas las facturas.
  * `GET /billing/reports` - Obtener reportes financieros y de consumo agregado.

### 💻 Frontend Interactivo Premium (`frontend`)
* **Tecnología**: React / Next.js (App Router) / Lucide Icons / CSS Modules.
* **Puerto**: `3000`
* **Estilo Visual**: Cosmic Dark / Glassmorphism de última generación, tipografía Outfity e Inter, gráficas SVG y micro-animaciones personalizadas.
* **Responsabilidad**:
  * **API Gateway Proxy**: Integración transparente (Next.js rewrites) a microservicios backend resolviendo 100% el CORS.
  * **Cruce de Datos en Tiempo Real**: Resolución automática de IDs de miembro a **Nombre Completo** y **Correo Electrónico** en todos los listados de reservas, cobros de facturas y reportes analíticos.
  * **Modales en Cristal Templado**: Unificación de alertas y confirmaciones mediante modales reactivos, logrando una app 100% libre de pop-ups nativos del navegador (`alert`/`confirm`).
  * **Búsqueda Avanzada**: Barra de búsqueda por texto libre y filtros de estado reactivos aplicados en Reservas y Facturas.
  * **Seeder Dev**: Botón discreto en login y script CLI (`npm run seed`) para poblar instantáneamente toda la DB con registros ficticios estructurados.

---

## 🐳 Guía de Inicio Rápido con Docker (Recomendado)

### Prerrequisitos
* Tener instalado **Docker** y **Docker Compose**.

### Instrucciones de Inicio

1. **Clona el repositorio** y navega a la carpeta raíz del proyecto.
2. **Levanta todos los microservicios y el frontend** de forma simultánea ejecutando:
   ```bash
   docker compose up --build
   ```

**¿Qué ocurre automáticamente al ejecutar este comando?**
1. Se crea e inicia un contenedor con **PostgreSQL 15** expuesto en el puerto `5432`.
2. Se compilan y arrancan los contenedores para `users-service`, `space-service`, `reservations-service`, `billing-service` y el `frontend` en Next.js.
3. El servicio de usuarios aplica automáticamente las migraciones de Alembic (`alembic upgrade head`).
4. El servicio de espacios auto-migra su modelo mediante GORM.
5. El servicio de reservas aplica sus migraciones nativas de SQLx para estructurar las tablas de reservas.
6. El servicio de facturación inicializa la tabla `invoices` en la base de datos compartida si no existe.
7. El frontend compila la aplicación en Next.js lista para producción y se expone en **`http://localhost:3000`**.
8. Todos los servicios quedan listos para recibir peticiones y comunicarse.

---

## 🧪 Pruebas de Integración y Flujo Completo (Consola / cURL)

A continuación se muestra un flujo completo paso a paso para probar los cuatro servicios de forma integrada.

### Paso 1: Registrar un Administrador (`users-service`)
Crea un usuario administrador para poder interactuar con los endpoints protegidos.
```bash
curl -X POST http://localhost:8000/usuarios/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_user",
    "email": "admin@coworking.com",
    "password": "SuperSecretPassword123",
    "role": "admin"
  }'
```

### Paso 2: Obtener Token JWT (Login)
Inicia sesión con el usuario creado para obtener el token de acceso.
```bash
curl -X POST http://localhost:8000/usuarios/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin_user&password=SuperSecretPassword123"
```
> 💡 *Guarda el valor de `access_token` devuelto por este endpoint.*

### Paso 3: Crear un Espacio de Trabajo (`space-service`)
Usa el token obtenido (reemplaza `<TOKEN>` abajo) para crear un espacio de co-working:
```bash
curl -X POST http://localhost:8081/spaces \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sala de Juntas Ejecutiva",
    "description": "Espacio premium con pantalla 4K y capacidad para 12 personas",
    "price_per_hour": 25.50
  }'
```

### Paso 4: Reservar el Espacio (`reservations-service`)
Usa el mismo token JWT para realizar una reserva para el espacio que acabas de crear (por ejemplo, con ID `1`):
```bash
curl -X POST http://localhost:8003/reservas \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "espacio_id": 1,
    "fecha": "2026-06-01",
    "hora_inicio": 9,
    "hora_fin": 12
  }'
```

### Paso 5: Generar una Factura (`billing-service`)
Genera una factura asociada a la reserva de espacio recién creada (por ejemplo, con ID `1`):
```bash
curl -X POST http://localhost:8082/billing/invoice \
  -H "Content-Type: application/json" \
  -d '{
    "reserva_id": 1,
    "monto": 76.50,
    "estado": "pagado"
  }'
```

### Paso 6: Consultar Reportes de Facturación (`billing-service`)
Obtén las métricas y el consolidado financiero calculado dinámicamente:
```bash
curl http://localhost:8082/billing/reports
```

---

## 🛑 Apagar el Ecosistema
Para detener todos los contenedores y liberar los puertos asignados de tu máquina, ejecuta:
```bash
docker compose down
```
> *Si deseas eliminar también los volúmenes persistentes de la base de datos para realizar un reinicio limpio, puedes usar `docker compose down -v`.*
