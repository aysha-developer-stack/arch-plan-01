@echo off
echo Starting DataMuse Frontend...
cd /d "s:\DataMuse"

REM Check if node is available
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is available
npm --version >nul 2>&1
if errorlevel 1 (
    echo Error: npm is not available
    pause
    exit /b 1
)

echo Node.js and npm are available
echo Installing dependencies if needed...
npm install

echo Starting Vite development server...
REM Try different methods to start Vite
echo Method 1: Using npx vite
npx vite --host --port 5173

if errorlevel 1 (
    echo Method 1 failed, trying Method 2: Using npm run dev
    npm run dev
)

if errorlevel 1 (
    echo Method 2 failed, trying Method 3: Direct node execution
    node node_modules\vite\bin\vite.js --host --port 5173
)

if errorlevel 1 (
    echo All methods failed. Please check your Node.js installation.
    echo Try running these commands manually:
    echo 1. npm install
    echo 2. npx vite --host
)

pause
