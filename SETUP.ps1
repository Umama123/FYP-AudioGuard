# ════════════════════════════════════════════════════════════
# AudioGuard with AudioSeal Watermarking - Quick Start Setup
# PowerShell Version
# ════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "🎵 AudioGuard + AudioSeal Setup Script (PowerShell)" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.10+ from python.org"
    Exit 1
}

Write-Host ""

# ════════════════════════════════════════════════════════════
Write-Host "📦 SETTING UP BACKEND" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Create virtual environment
if (-not (Test-Path "env")) {
    Write-Host "🔧 Creating virtual environment..." -ForegroundColor Yellow
    python -m venv env
    Write-Host "✅ Virtual environment created" -ForegroundColor Green
} else {
    Write-Host "✅ Virtual environment already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "📥 Activating virtual environment..." -ForegroundColor Yellow

# Activate virtual environment
& ".\env\Scripts\Activate.ps1"

Write-Host "✅ Virtual environment activated" -ForegroundColor Green
Write-Host ""

# Upgrade pip
Write-Host "🚀 Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip -q
Write-Host "✅ pip upgraded" -ForegroundColor Green
Write-Host ""

# Install requirements
Write-Host "📚 Installing Python dependencies..." -ForegroundColor Yellow
Write-Host "   (This may take 5-10 minutes on first run)" -ForegroundColor DarkGray
Write-Host ""

pip install -r requirements.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install requirements" -ForegroundColor Red
    Write-Host "Try running manually:" -ForegroundColor Yellow
    Write-Host "  .\env\Scripts\Activate.ps1"
    Write-Host "  pip install -r requirements.txt"
    Exit 1
}

Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
Write-Host ""

# ════════════════════════════════════════════════════════════
Write-Host "📦 SETTING UP FRONTEND" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Set-Location "AudioGuard_flask 4_new\frontend"

if (-not (Test-Path "node_modules")) {
    Write-Host "📥 Installing npm dependencies..." -ForegroundColor Yellow
    Write-Host "   (This may take 3-5 minutes)" -ForegroundColor DarkGray
    Write-Host ""
    
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install npm packages" -ForegroundColor Red
        Write-Host "Make sure Node.js is installed: https://nodejs.org/" -ForegroundColor Yellow
        Exit 1
    }
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Frontend dependencies already installed" -ForegroundColor Green
}

Set-Location "..\..\"
Write-Host ""

# ════════════════════════════════════════════════════════════
Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 TO RUN THE APPLICATION:" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. BACKEND (Terminal/PowerShell 1):" -ForegroundColor White
Write-Host "   .\env\Scripts\Activate.ps1" -ForegroundColor Yellow
Write-Host "   python app.py" -ForegroundColor Yellow
Write-Host "   (Should show: * Running on http://localhost:5001)" -ForegroundColor DarkGray
Write-Host ""

Write-Host "2. FRONTEND (Terminal/PowerShell 2):" -ForegroundColor White
Write-Host "   cd 'AudioGuard_flask 4_new\frontend'" -ForegroundColor Yellow
Write-Host "   .\.venv\Scripts\Activate.ps1" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor Yellow
Write-Host "   (Should show: Local: http://localhost:5173)" -ForegroundColor DarkGray
Write-Host ""

Write-Host "3. OPEN BROWSER:" -ForegroundColor White
Write-Host "   http://localhost:5173" -ForegroundColor Yellow
Write-Host ""

Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔒 Features:" -ForegroundColor Cyan
Write-Host "  ✅ Audio Detection (deepfake analysis)" -ForegroundColor Green
Write-Host "  ✅ Audio Regeneration" -ForegroundColor Green
Write-Host "  ✅ AudioSeal Watermarking (embed & detect)" -ForegroundColor Green
Write-Host "  ✅ Legal Report Integration" -ForegroundColor Green
Write-Host "  ✅ Awareness & Education" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "📚 For detailed setup: See WATERMARKING_SETUP.md" -ForegroundColor Magenta
Write-Host ""

Write-Host "Press Enter to exit..." -ForegroundColor Yellow
Read-Host
