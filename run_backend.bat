@echo off
title CampusConnect Backend (FastAPI :8001)
cd /d "%~dp0backend"
set PYTHONPATH=%~dp0
echo Starting CampusConnect FastAPI Backend on http://localhost:8001 ...
python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload
pause
