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

Antes de instalar, asegúrate de tener:

1. **Node.js** v18 o superior → [https://nodejs.org](https://nodejs.org) (descargar versión LTS)
2. **PostgreSQL** v14 o superior → [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)

> **Tip:** Al instalar PostgreSQL, anota el **usuario** (generalmente `postgres`) y la **contraseña** que elijas. Los necesitarás después.

---

## 🚀 Instalación rápida (Windows)

### Paso 1: Crear la base de datos

Abre **pgAdmin** (se instala junto con PostgreSQL) y:

1. Click derecho en **Databases** → **Create** → **Database**
2. Nombre: `mmcafe`
3. Click **Save**

O si prefieres por terminal, abre **SQL Shell (psql)** y escribe:
```sql
CREATE DATABASE mmcafe;
```

### Paso 2: Configurar la conexión

1. Abre el archivo `backend\.env.example` con un editor de texto
2. Cámbiale el nombre a `backend\.env`  
3. Edita la línea `DATABASE_URL` con tus datos de PostgreSQL:

```env
DATABASE_URL="postgresql://postgres:TuContraseñaDePostgres@localhost:5432/mmcafe"
```

> Reemplaza `TuContraseñaDePostgres` con la contraseña que creaste al instalar PostgreSQL.

### Paso 3: Ejecutar la instalación

Haz **doble clic** en:

```
📄 INSTALAR.bat
```

Este script automáticamente:
- ✅ Instala todas las dependencias
- ✅ Crea las tablas en la base de datos
- ✅ Carga el menú completo y usuarios iniciales
- ✅ Compila el frontend

### Paso 4: ¡Iniciar!

Haz **doble clic** en:

```
📄 INICIAR.bat
```

Se abrirá una ventana de terminal. Verás algo como:

```
🚀 M&M Café running on http://localhost:4000
🌐 LAN: http://192.168.1.XX:4000
```

**Abre tu navegador** y ve a: **http://localhost:4000**

> 📱 Para acceder desde el celular (misma red WiFi), usa la dirección LAN que aparece en la terminal.

---

## 🔑 Credenciales por defecto

| Rol | Correo | Contraseña |
|-----|--------|------------|
| **Administrador** | `admin@mmcafe.com` | `admin123` |
| **Empleado** | `empleado@mmcafe.com` | `empleado123` |
| **Cocina** | `cocina@mmcafe.com` | `cocina123` |

> ⚠️ **Importante:** Cambia estas contraseñas desde el módulo de Usuarios una vez que entres al sistema.

---

## 📱 Acceso desde celular/tablet

El sistema funciona como aplicación web. Para acceder desde otros dispositivos:

1. Asegúrate de que estén conectados a la **misma red WiFi**
2. Usa la dirección **LAN** que mostró INICIAR.bat (ej: `http://192.168.1.5:4000`)
3. En el celular, puedes **"Agregar a pantalla de inicio"** para que se abra como app

---

## 🔄 Uso diario

1. **Encender la computadora** donde está el sistema
2. **Ejecutar** `INICIAR.bat` (doble clic)
3. **Abrir** el navegador en `http://localhost:4000`
4. **Al terminar**, cierra la ventana de la terminal o presiona `Ctrl+C`

> PostgreSQL se ejecuta automáticamente como servicio de Windows, no necesitas hacer nada con él.

---

## 📦 Módulos del sistema

| Módulo | Descripción | Acceso |
|--------|-------------|--------|
| **Dashboard** | Ventas del día, semana, gráficas, actividad reciente | Admin |
| **Punto de Venta** | Crear órdenes, carrito, enviar a cocina, cobro | Admin, Empleado |
| **Cocina** | Ver pedidos pendientes, marcar en preparación y listos | Cocina |
| **Gestión de Menú** | CRUD de productos y categorías, disponibilidad | Admin |
| **Reportes** | Reportes por rango de fechas, exportar PDF y Excel | Admin |
| **Historial** | Consulta de ventas con filtros, ver detalle, anular | Admin, Empleado (solo ver) |
| **Cierre de Caja** | Resumen de ventas del día, totales por método de pago | Admin, Empleado |
| **Usuarios** | CRUD de usuarios, gestión de roles (Admin/Empleado/Cocina) | Admin |

---

## 📂 Estructura del proyecto

```
MM_Cafe/
├── INSTALAR.bat               ← Ejecutar una sola vez
├── INICIAR.bat                ← Ejecutar cada día para abrir el sistema
├── backend/
│   ├── .env                   # Configuración (DB, secretos)
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
│   └── uploads/               # Imágenes de productos
├── frontend/
│   ├── src/                   # Código fuente React
│   ├── dist/                  # Frontend compilado (se genera)
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

## 🔧 Instalación para desarrollo

Si quieres modificar el código:

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev               # Servidor en http://localhost:4000

# Terminal 2 - Frontend  
cd frontend
npm install
npm run dev               # Vite dev en http://localhost:5173
```

---

## 🛑 Solución de problemas

| Problema | Solución |
|----------|----------|
| "Error en las migraciones" | Verifica que PostgreSQL esté corriendo y que DATABASE_URL sea correcta |
| "ECONNREFUSED" | PostgreSQL no está encendido. Abre Services (servicios) y busca "postgresql", dale Start |
| Página en blanco | Ejecuta INSTALAR.bat de nuevo para recompilar el frontend |
| No carga desde celular | Verifica que estén en la misma red WiFi |
| "Puerto 4000 en uso" | Cierra la terminal anterior o cambia el PORT en backend/.env |

---

## 💡 Notas

- La moneda utilizada es **Lempiras (L.)** 🇭🇳
- Las imágenes de productos se guardan en `backend/uploads/`
- El sistema soporta **modo oscuro** 🌙 (botón en el header)
- Las contraseñas se encriptan con bcrypt (12 rounds)
- Los tokens de acceso expiran en 8 horas con refresh automático

---

Desarrollado con ❤️ para **M&M Café y Más...**
