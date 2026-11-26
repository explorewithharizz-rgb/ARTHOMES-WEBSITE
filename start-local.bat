@echo off
title ART HOME Interiors - Local Server
cd /d "%~dp0"

echo ========================================================
echo   Starting ART HOME Interiors Redesign (Local Server)
echo   URL: http://localhost:3000/
echo ========================================================
echo.

node server.js
pause
