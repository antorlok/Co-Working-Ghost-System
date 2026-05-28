# 🏢 Plataforma de Co-working - Arquitectura de Microservicios

Este repositorio contiene la arquitectura modular y distribuida para la plataforma de Co-working y Reservación de Espacios. Se compone de tres microservicios principales interconectados mediante una base de datos PostgreSQL compartida y validación criptográfica de Tokens JWT.

---

## 🏛️ Estructura del Monorepo

```text
.
├── services/
│   ├── users-service/      # 🔐 FastAPI (Python) - Puerto 8000
│   │                       # Gestión de usuarios, roles (admin/member) y JWT.
│   │
│   ├── space-service/      # 🚗 Go / Gin / GORM - Puerto 8081
│   │                       # CRUD de espacios de co-working con Soft Deletes.
│   │
│   └── billing-service/    # 🧾 Express.js (Node.js) - Puerto 8082
│                           # Facturación, cálculo automático de reportes e ingresos.
│
├── docker-compose.yml      # 🐳 Orquestador local multi-contenedor
└── README.md               # 📖 Guía de inicio rápido e integración
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

### 2. 🏛️ Servicio de Espacios (`space-service`)
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

### 3. 🧾 Servicio de Facturación y Reportes (`billing-service`)
* **Tecnología**: Node.js / Express.js / `pg` (PostgreSQL Client Pool).
* **Puerto**: `8082`
* **Responsabilidad**:
  * Generación y registro de facturas asociadas a reservas (`invoices`).
  * Consultas rápidas y agregación eficiente con complejidad $O(N)$ para reportes financieros y de uso.
  * Inicialización automática del esquema de tablas de facturación.
* **Endpoints Clave**:
  * `POST /billing/invoice` - Crear nueva factura.
  * `GET /billing/invoices` - Listar todas las facturas.
  * `GET /billing/reports` - Obtener reportes financieros y de consumo agregado (Ingresos totales, promedio de montos, y conteo de estados de factura).

---

## 🐳 Guía de Inicio Rápido con Docker (Recomendado)

### Prerrequisitos
* Tener instalado **Docker** y **Docker Compose**.

### Instrucciones de Inicio

1. **Clona el repositorio** y navega a la carpeta raíz del proyecto.
2. **Levanta todos los microservicios** de forma simultánea ejecutando:
   ```bash
   docker compose up --build
   ```

**¿Qué ocurre automáticamente al ejecutar este comando?**
1. Se crea e inicia un contenedor con **PostgreSQL 15** expuesto en el puerto `5432`.
2. Se compilan y arrancan los contenedores para `users-service`, `space-service` y `billing-service`.
3. El servicio de usuarios aplica automáticamente las migraciones pendientes vía Alembic (`alembic upgrade head`).
4. El servicio de espacios auto-migra su modelo mediante GORM.
5. El servicio de facturación inicializa la tabla `invoices` en la base de datos compartida si no existe.
6. Todos los servicios quedan listos para recibir peticiones y comunicarse.

---

## 🧪 Pruebas de Integración y Flujo Completo (Consola / cURL)

A continuación se muestra un flujo completo paso a paso para probar los tres servicios de forma integrada.

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

### Paso 4: Generar una Factura (`billing-service`)
Genera una factura asociada a una reserva de espacio:
```bash
curl -X POST http://localhost:8082/billing/invoice \
  -H "Content-Type: application/json" \
  -d '{
    "reserva_id": 101,
    "monto": 76.50,
    "estado": "pagado"
  }'
```

### Paso 5: Consultar Reportes de Facturación (`billing-service`)
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
