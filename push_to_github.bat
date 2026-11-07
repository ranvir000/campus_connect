@echo off
title Push CampusConnect to GitHub
cd /d "%~dp0"
echo ====================================================
echo  Pushing CampusConnect to https://github.com/ranvir000/campus_connect
echo ====================================================
git push -u origin main
echo.
if %ERRORLEVEL% equ 0 (
    echo ====================================================
    echo  SUCCESS! Code pushed to GitHub successfully.
    echo ====================================================
) else (
    echo ====================================================
    echo  Push failed. Check error above.
    echo ====================================================
)
pause
