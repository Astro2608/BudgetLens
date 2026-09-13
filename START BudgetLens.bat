@echo off
title BudgetLens — Launcher
color 0A

echo.
echo  =============================================
echo   BudgetLens ^| Cash Flow in Focus
echo  =============================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed on this machine.
    echo.
    echo  Please install Node.js first:
    echo  https://nodejs.org  ^(download the LTS version^)
    echo.
    echo  After installing, run this file again.
    echo.
    pause
    start https://nodejs.org
    exit /b 1
)

:: Check if node_modules exists, install if missing
if not exist "node_modules\" (
    echo  Installing dependencies for the first time...
    echo  ^(This takes about 30 seconds and only happens once^)
    echo.
    call npm install --silent
    if %errorlevel% neq 0 (
        echo  [ERROR] Failed to install dependencies.
        echo  Please check your internet connection and try again.
        pause
        exit /b 1
    )
    echo  Done!
    echo.
)

:: Start the app
echo  Starting BudgetLens...
echo  Opening in your browser at http://localhost:5173
echo.
echo  TIP: In Chrome or Edge, click the Install icon (circle+) in the
echo       address bar to install as a desktop app.
echo.
echo  Keep this window open while using BudgetLens.
echo  Close it when you're done.
echo.

:: Open browser after short delay
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5173"

:: Start dev server
npm run dev
