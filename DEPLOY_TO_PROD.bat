@echo off
title Audira YT Monitor - Deploy to Production Mini PC (24/7)
color 0A

echo ========================================================
echo   AUDIRA YT MONITOR - PRODUCTION DEPLOYMENT ENGINE
echo ========================================================
echo.

echo [*] STEP 1: Running Automated Pre-Flight Safety Gate...
python scripts\preflight_check.py
if errorlevel 1 (
    echo.
    echo [!] DEPLOYMENT ABORTED: Pre-flight validation failed!
    echo [!] Fix the errors reported above before deploying to main.
    pause
    exit /b 1
)

echo.
echo [*] STEP 2: Creating Automated Database Snapshot Backup...
python scripts\db_backup.py

echo.
echo [*] STEP 3: Promoting DEV branch features to MAIN (Production)...
git checkout main
if errorlevel 1 (
    echo [!] Failed to switch to branch main!
    pause
    exit /b 1
)

git merge dev -m "Promote dev features to production main branch"
if errorlevel 1 (
    echo [!] Git merge conflict detected! Please resolve conflicts before releasing.
    git checkout dev
    pause
    exit /b 1
)

echo.
echo [*] STEP 4: Pushing production code to GitHub main repository...
git push origin main
if errorlevel 1 (
    echo [!] Failed to push to GitHub!
    git checkout dev
    pause
    exit /b 1
)

echo.
echo [*] STEP 5: Triggering Mini PC Server Database & Application Sync (192.168.100.178)...
python scripts\deploy_db_to_minipc.py
if exist scratch\update_minipc_alert_system.py (
    python scratch\update_minipc_alert_system.py
)

echo.
echo [*] STEP 6: Zero-Downtime Health Check Verification...
python scripts\healthcheck_rollback.py
if errorlevel 1 (
    echo [!] Health check failed post-deployment. System performed automated rollback.
    git checkout dev
    pause
    exit /b 1
)

echo.
echo [*] STEP 7: Returning laptop to DEV branch (Development Zone)...
git checkout dev

echo.
echo ========================================================
echo   SUCCESS! PRODUCTION DEPLOYMENT COMPLETED 100%! 🚀
echo ========================================================
echo.
echo Server Mini PC (192.168.100.178) is running 100% healthy.
echo Laptop returned to DEV branch for next developments.
echo.
pause

