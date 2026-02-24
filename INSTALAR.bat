@echo off
chcp 65001 >nul
title M&M Café - Instalación
echo.
echo ╔══════════════════════════════════════════╗
echo ║     M&M Café y Más... - Instalación     ║
echo ╚══════════════════════════════════════════╝
echo.

:: Verificar Node.js
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js no está instalado.
    echo    Descárgalo de: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js encontrado

:: Verificar que existe .env
if not exist "backend\.env" (
    echo.
    echo ⚠️  No se encontró backend\.env
    echo    Creando uno desde .env.example...
    copy "backend\.env.example" "backend\.env" >nul
    echo.
    echo ╔══════════════════════════════════════════════════════════╗
    echo ║  IMPORTANTE: Edita backend\.env con tus datos de        ║
    echo ║  PostgreSQL antes de continuar.                         ║
    echo ║                                                         ║
    echo ║  Abre: backend\.env                                     ║
    echo ║  Cambia: DATABASE_URL con tu usuario y contraseña       ║
    echo ╚══════════════════════════════════════════════════════════╝
    echo.
    pause
)

echo.
echo 📦 Instalando dependencias del backend...
cd backend
call npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ Error instalando dependencias del backend
    pause
    exit /b 1
)

echo.
echo 📦 Generando cliente Prisma...
call npx prisma generate
if %ERRORLEVEL% neq 0 (
    echo ❌ Error generando Prisma client
    pause
    exit /b 1
)

echo.
echo 🗄️  Aplicando migraciones a la base de datos...
call npx prisma migrate deploy
if %ERRORLEVEL% neq 0 (
    echo ❌ Error en las migraciones. ¿PostgreSQL está corriendo?
    echo    Verifica tu DATABASE_URL en backend\.env
    pause
    exit /b 1
)

echo.
echo 🌱 Cargando datos iniciales (menú, usuarios)...
call npx tsx prisma/seed.ts
if %ERRORLEVEL% neq 0 (
    echo ⚠️  El seed falló (puede que los datos ya existan, esto es normal)
)

echo.
echo 📦 Instalando dependencias del frontend...
cd ..\frontend
call npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ Error instalando dependencias del frontend
    pause
    exit /b 1
)

echo.
echo 🔨 Compilando frontend...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ Error compilando el frontend
    pause
    exit /b 1
)

cd ..
echo.
echo ╔══════════════════════════════════════════╗
echo ║     ✅ ¡Instalación completada!         ║
echo ║                                          ║
echo ║  Ahora ejecuta: INICIAR.bat              ║
echo ╚══════════════════════════════════════════╝
echo.
pause
