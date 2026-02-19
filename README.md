# ☕ M&M Café y Más...

> Sistema de gestión y punto de venta para **M&M Café y Más...** – Establecido en 2024.

Aplicación full-stack con módulos de POS, gestión de menú, reportes, historial de ventas y administración de usuarios.

---

## 🛠️ Tecnologías

| Capa | Tecnología |
|------|------------|
| **Frontend** | React 18, Vite 5, TypeScript, Tailwind CSS, Zustand, Recharts, Framer Motion |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM |
| **Base de datos** | PostgreSQL |
| **Autenticación** | JWT (access + refresh tokens), bcrypt |
| **Exportación** | jsPDF, xlsx |

---

## 📋 Prerrequisitos

- **Node.js** v18 o superior → [https://nodejs.org](https://nodejs.org)
- **PostgreSQL** v14 o superior → [https://www.postgresql.org/download/](https://www.postgresql.org/download/)
- **npm** (incluido con Node.js)

---

## 🚀 Instalación paso a paso

### 1. Crear la base de datos

Abre **pgAdmin** o una terminal de PostgreSQL y ejecuta:

```sql
CREATE DATABASE mm_cafe;
```

### 2. Configurar el Backend

```bash
# Ir a la carpeta del backend
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
# Edita el archivo .env y ajusta la conexión a PostgreSQL:
#   DATABASE_URL="postgresql://TU_USUARIO:TU_PASSWORD@localhost:5432/mm_cafe?schema=public"
# Cambia TU_USUARIO y TU_PASSWORD por tus credenciales de PostgreSQL.

# Crear las tablas en la base de datos
npx prisma migrate dev --name init

# Cargar datos iniciales (menú, categorías, usuarios)
npx prisma db seed

# Iniciar el servidor de desarrollo
npm run dev
```

El backend estará corriendo en **http://localhost:4000**.

### 3. Configurar el Frontend

Abre **otra terminal**:

```bash
# Ir a la carpeta del frontend
cd frontend

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

El frontend estará corriendo en **http://localhost:5173**.

---

## 🔑 Credenciales por defecto

| Rol | Correo | Contraseña |
|-----|--------|------------|
| **Administrador** | `admin@mmcafe.com` | `admin123` |
| **Cajero** | `cajero@mmcafe.com` | `cajero123` |

---

## 📦 Módulos del sistema

| Módulo | Descripción | Acceso |
|--------|-------------|--------|
| **Dashboard** | Ventas del día, semana, gráficas, actividad reciente | Admin |
| **Punto de Venta** | Crear órdenes, carrito, cobro en efectivo/tarjeta | Admin, Cajero |
| **Gestión de Menú** | CRUD de productos, categorías, disponibilidad | Admin |
| **Reportes** | Reportes por rango de fechas, exportar PDF y Excel | Admin |
| **Historial** | Consulta de ventas con filtros, ver detalle, anular | Admin, Cajero (solo ver) |
| **Usuarios** | CRUD de usuarios, activar/desactivar cuentas | Admin |

---

## 📂 Estructura del proyecto

```
M&M/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Modelos de la base de datos
│   │   └── seed.ts            # Datos iniciales
│   ├── src/
│   │   ├── config/            # Variables de entorno
│   │   ├── controllers/       # Lógica de negocio
│   │   ├── middleware/        # Auth, upload
│   │   ├── routes/            # Endpoints de la API
│   │   ├── validators/        # Esquemas Zod
│   │   ├── lib/               # Prisma client
│   │   └── server.ts          # Entry point
│   ├── .env                   # Variables de entorno
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # Layout, ProtectedRoute
│   │   ├── pages/             # Páginas de la app
│   │   ├── stores/            # Estado global (Zustand)
│   │   ├── lib/               # API client, utilidades
│   │   ├── types/             # Interfaces TypeScript
│   │   ├── App.tsx            # Rutas principales
│   │   └── main.tsx           # Entry point
│   ├── index.html
│   └── package.json
└── images/                    # Logo y recursos gráficos
```

---

## 🎨 Paleta de colores

| Color | Hex | Uso |
|-------|-----|-----|
| **Café** | `#6B3A2A` | Color principal, sidebar, botones |
| **Crema** | `#FAF5EE` | Fondo claro, cards |
| **Dorado** | `#C8973A` | Acentos, precios, highlights |

---

## 💡 Notas

- La moneda utilizada es **Lempiras (L.)** 🇭🇳
- Las imágenes de productos se guardan en `backend/uploads/`
- El sistema soporta **modo oscuro** 🌙
- Las contraseñas se encriptan con bcrypt (12 rounds)
- Los tokens de acceso expiran en 15 minutos con refresh automático

---

Desarrollado con ❤️ para **M&M Café y Más...**
