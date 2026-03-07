@echo off
title SignBridge Launcher
echo =======================================
echo     Starting SignBridge Application
echo =======================================
echo.

echo [1/2] Starting Node.js Backend Server on Port 5000...
start "SignBridge Backend" cmd /k "cd backend && node index.js"

echo [2/2] Starting React Vite Frontend Server on Port 5173...
start "SignBridge Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo SignBridge development environments are starting up!
echo Ensure you allow any Node.js prompts through your firewall.
echo.
echo Opening localhost in your browser...
ping 127.0.0.1 -n 4 > nul
start http://localhost:5173
echo.
pause
