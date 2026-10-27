@echo off
title WAludo - Start Full Stack (Backend + App)
color 0A
echo ========================================================
echo        🚀 STARTING WALUDO GAMING PLATFORM
echo ========================================================
echo.

cd /d "%~dp0backend"
echo [1/2] Launching Backend Server on Port 5003...
start "WAludo Backend (Port 5003)" cmd /k "color 0B && node server.js"

timeout /t 3 /nobreak >nul

cd /d "%~dp0app"
echo [2/2] Launching Frontend App on Port 5001...
start "WAludo App (Port 5001)" cmd /k "color 0E && node server.cjs"

timeout /t 2 /nobreak >nul

echo.
echo ========================================================
echo   Both services are running!
echo   - App URL:     http://localhost:5001
echo   - Backend URL: http://localhost:5003
echo ========================================================
echo.
echo Opening browser in 2 seconds...
timeout /t 2 /nobreak >nul
start http://localhost:5001
