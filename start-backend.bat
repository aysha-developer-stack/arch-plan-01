@echo off
echo Starting DataMuse Backend Server...
cd /d "s:\DataMuse"

REM Check if node is available
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo Starting backend development server...
echo Backend will be available at: http://localhost:5000
echo API endpoints will be at: http://localhost:5000/api/*
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev

pause
