@echo off
title WAludo - Frontend App (Port 5001)
color 0E
echo ========================================================
echo        🚀 STARTING WALUDO FRONTEND APP (Port 5001)
echo ========================================================
echo.
cd /d "%~dp0app"
node server.cjs
pause
