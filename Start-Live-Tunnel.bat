@echo off
title WAludo - Public Live Tunnel (Cloudflare Tunnel)
color 0B
echo ========================================================
echo        🌐 STARTING WALUDO LIVE PUBLIC TUNNEL
echo ========================================================
echo.
echo Connecting local port 5001 to Cloudflare edge...
echo.
"%~dp0cloudflared.exe" tunnel --url http://127.0.0.1:5001
pause
