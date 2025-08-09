@echo off
echo Checking for processes using port 5000...

REM Find and kill processes using port 5000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    echo Found process using port 5000: %%a
    taskkill /f /pid %%a >nul 2>&1
    if errorlevel 1 (
        echo Could not kill process %%a
    ) else (
        echo Killed process %%a
    )
)

echo Port 5000 should now be free.
pause
