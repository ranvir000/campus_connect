@echo off
title CampusConnect Frontend (Vite :3000)
cd /d "%~dp0frontend"
echo Installing frontend dependencies if needed...
call npm install
echo Starting Vite Dev Server on http://localhost:3000 ...
call npm run dev
pause
