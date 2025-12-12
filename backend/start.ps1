# PowerShell script to set up and run the PatternCrafter backend

Write-Host "Setting up PatternCrafter Backend..." -ForegroundColor Green

# Check if Python is installed
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Python is not installed or not in PATH. Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check if we're in a virtual environment
if (!$env:VIRTUAL_ENV) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & ".\venv\Scripts\Activate.ps1"
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Check if .env file exists
if (!(Test-Path ".env")) {
    Write-Host "Environment file (.env) not found. Please create one based on the example." -ForegroundColor Red
    Write-Host "Example .env content:" -ForegroundColor Yellow
    Write-Host "MONGODB_URL=mongodb://localhost:27017" -ForegroundColor Gray
    Write-Host "DATABASE_NAME=patterncrafter" -ForegroundColor Gray
    Write-Host "SECRET_KEY=your-secret-key-here-change-in-production" -ForegroundColor Gray
    exit 1
}

# Start the server
Write-Host "Starting FastAPI server..." -ForegroundColor Green
Write-Host "API Documentation will be available at: https://patterncrafter.onrender.com/docs" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow

python run.py