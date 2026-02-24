@echo off
chcp 65001 >nul
title M&M Café y Más...
echo.
echo ╔══════════════════════════════════════════╗
echo ║      M&M Café y Más... - Servidor       ║
echo ╚══════════════════════════════════════════╝
echo.

:: Verificar que existe .env
if not exist "backend\.env" (
    echo ❌ No se encontró backend\.env
    echo    Ejecuta INSTALAR.bat primero.
    pause
    exit /b 1
)

:: Verificar que existe el frontend compilado
if not exist "frontend\dist\index.html" (
    echo ❌ El frontend no está compilado.
    echo    Ejecuta INSTALAR.bat primero.
    pause
    exit /b 1
)

echo 🚀 Iniciando M&M Café...
echo.
echo    Para detener: presiona Ctrl+C
echo    ─────────────────────────────────
echo.

cd backend
call npx tsx src/server.ts
pause
