@echo off
title Audira YT Monitor - GitHub Auto Save & Push
color 0A

echo ========================================================
echo        AUDIRA YT MONITOR - GITHUB AUTO SAVE & PUSH
echo ========================================================
echo.

cd /d %~dp0

:: Check if git is initialized
if not exist ".git" (
    echo [*] Initializing Git repository...
    git init
)

:: Check git remote origin
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [*] Adding GitHub remote origin...
    git remote add origin https://github.com/Audira141415/Audira-YT.git
) else (
    echo [*] Updating GitHub remote origin URL...
    git remote set-url origin https://github.com/Audira141415/Audira-YT.git
)

:: Ensure main branch
git branch -M main

echo [*] Staging all project files...
git add .

echo [*] Committing changes...
git commit -m "Save & Update Audira YT Monitor Ultimate Version - %DATE% %TIME%"

echo [*] Pushing code to GitHub (https://github.com/Audira141415/Audira-YT.git)...
git push -u origin main

if errorlevel 1 (
    echo.
    echo [!] Push failed or remote conflict detected. Trying pull with rebase...
    git pull origin main --rebase
    git push -u origin main
)

echo.
echo ========================================================
echo      BERHASIL DISIMPAN & DIPUSH KE GITHUB! 🚀
echo ========================================================
echo.
pause
