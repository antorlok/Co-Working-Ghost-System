# 💻 Next.js Frontend - Plataforma de Co-working Premium

Este directorio contiene el frontend desarrollado en **Next.js (App Router)** para unificar visualmente las APIs del ecosistema del coworking (`users-service`, `space-service`, `reservations-service`, y `billing-service`) en una sola aplicación interactiva y responsiva de nivel premium.

---

## ✨ Características Premium Implementadas

1. **Diseño Cosmic Dark / Glassmorphism**:
   - Estética visual moderna basada en gradientes dinámicos, bordes ultra-delgados con brillo y efecto de vidrio esmerilado (*frosted glass*).
   - Tipografía Outfit para títulos elegantes e Inter para cuerpo de texto de alta legibilidad.
2. **Cruce de Datos en Tiempo Real (Resolución de Miembros)**:
   - Los listados generales de reservas, facturas, comprobantes de pago e informes analíticos consumen la API de usuarios para resolver IDs y renderizar el **Nombre** y **Email** del miembro directamente.
3. **Búsqueda Avanzada y Filtros de Estado**:
   - Filtrado en tiempo real en los listados generales por estado (`Todos`, `Pagado`, `Pendiente`, `Cancelada`, `En Cola Rust`) y cadenas de texto libre.
4. **Dashboard Analítico Financiero (SVG)**:
   - Panel interactivo exclusivo para el administrador con métricas clave e ingresos representados mediante gráficas e indicadores dinámicos programados puramente en SVG y CSS animado.
5. **API Gateway Proxy (Next.js Rewrites)**:
   - Enrutamiento interno inverso que mapea `/api/*` hacia sus respectivos microservicios sin alterar sus códigos fuente, evadiendo por completo cualquier conflicto de CORS.

---

## 🛠️ Puesta en Marcha en Desarrollo

### Prerrequisitos
* Tener instalado **Node.js** (v18 o superior) y **npm**.

### Pasos para iniciar

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Asegurar que los microservicios backend estén activos**:
   En la raíz del proyecto general:
   ```bash
   docker compose up --build postgres-db users-service space-service reservations-service billing-service
   ```

3. **Iniciar el servidor de desarrollo Next.js**:
   ```bash
   npm run dev
   ```

4. **Acceder a la aplicación**:
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🔑 Credenciales de Prueba (Seeder)

Puedes usar la herramienta de **"Poblar Base de Datos" (Seed)** ubicada en la pantalla de Inicio de Sesión (`/login`) para rellenar la base de datos con espacios físicos, reservas prioritarias y reportes.

* **Cuenta Administrador**:
  * **Email**: `admin@coworking.com`
  * **Contraseña**: `AdminPassword123!`
* **Cuenta Miembro**:
  * **Email**: `member@coworking.com`
  * **Contraseña**: `MemberPassword123!`
