@echo off
title Deploy WAludo to Cloudflare Workers
echo ========================================================
echo  Deploying WAludo to Cloudflare Workers
echo ========================================================
echo.
cd /d "%~dp0app"
echo [1/2] Authenticating with Cloudflare (Your browser will open to click 'Allow')...
call npx wrangler login
echo.
echo [2/2] Deploying App to friendludo-app.khalilah647801898.workers.dev...
call npx wrangler deploy
echo.
echo ========================================================
echo  Deployment Complete! Hard refresh your browser (Ctrl+F5)
echo ========================================================
pause
