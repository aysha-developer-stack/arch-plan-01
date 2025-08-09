Write-Host "Starting DataMuse Frontend..." -ForegroundColor Green

# Set location to project directory
Set-Location "s:\DataMuse"

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: npm is not available" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Install dependencies
Write-Host "Installing dependencies if needed..." -ForegroundColor Yellow
npm install

# Try to start Vite development server
Write-Host "Starting Vite development server..." -ForegroundColor Green

# Method 1: Using npx vite
Write-Host "Method 1: Using npx vite --host --port 5173" -ForegroundColor Cyan
try {
    npx vite --host --port 5173
} catch {
    Write-Host "Method 1 failed" -ForegroundColor Red
    
    # Method 2: Using npm run dev (if available)
    Write-Host "Method 2: Trying npm run dev" -ForegroundColor Cyan
    try {
        npm run dev
    } catch {
        Write-Host "Method 2 failed" -ForegroundColor Red
        
        # Method 3: Direct node execution
        Write-Host "Method 3: Direct node execution" -ForegroundColor Cyan
        try {
            node node_modules/vite/bin/vite.js --host --port 5173
        } catch {
            Write-Host "All methods failed. Please check your setup." -ForegroundColor Red
            Write-Host "Try running these commands manually:" -ForegroundColor Yellow
            Write-Host "1. npm install" -ForegroundColor White
            Write-Host "2. npx vite --host" -ForegroundColor White
        }
    }
}

Read-Host "Press Enter to exit"
