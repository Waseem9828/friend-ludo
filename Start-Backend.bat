@echo off
title WAludo - Backend Server (Port 5003)
color 0B
echo ========================================================
echo        🚀 STARTING WALUDO BACKEND SERVER (Port 5003)
echo ========================================================
echo.
cd /d "%~dp0backend"
node server.js
pause
