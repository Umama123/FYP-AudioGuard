@echo off
REM ════════════════════════════════════════════════════════════
REM  AudioGuard with AudioSeal Watermarking - Quick Start Setup
REM ════════════════════════════════════════════════════════════

echo.
echo 🎵 AudioGuard + AudioSeal Setup Script
echo ════════════════════════════════════════════════════════════
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.10+ from python.org
    pause
    exit /b 1
)

echo ✅ Python found: 
python --version
echo.

REM Setup Backend
echo ════════════════════════════════════════════════════════════
echo 📦 SETTING UP BACKEND
echo ════════════════════════════════════════════════════════════
echo.

REM Create virtual environment
if not exist "env" (
    echo 🔧 Creating virtual environment...
    python -m venv env
    echo ✅ Virtual environment created
) else (
    echo ✅ Virtual environment already exists
)

echo.
echo 📥 Activating virtual environment...
call env\Scripts\activate.bat

echo ✅ Virtual environment activated
echo.

REM Upgrade pip
echo 🚀 Upgrading pip...
python -m pip install --upgrade pip -q

REM Install requirements
echo 📚 Installing Python dependencies...
echo    (This may take 5-10 minutes on first run)
echo.
pip install -r requirements.txt

if errorlevel 1 (
    echo ❌ Failed to install requirements
    echo Try running manually:
    echo   .\env\Scripts\activate.bat
    echo   pip install -r requirements.txt
    pause
    exit /b 1
)

echo ✅ Backend dependencies installed
echo.

REM Setup Frontend
echo ════════════════════════════════════════════════════════════
echo 📦 SETTING UP FRONTEND
echo ════════════════════════════════════════════════════════════
echo.

cd "AudioGuard_flask 4_new\frontend"

if not exist "node_modules" (
    echo 📥 Installing npm dependencies...
    echo    (This may take 3-5 minutes)
    echo.
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install npm packages
        echo Make sure Node.js is installed: https://nodejs.org/
        pause
        exit /b 1
    )
    echo ✅ Frontend dependencies installed
) else (
    echo ✅ Frontend dependencies already installed
)

cd ..\..
echo.

REM Done
echo ════════════════════════════════════════════════════════════
echo ✅ SETUP COMPLETE!
echo ════════════════════════════════════════════════════════════
echo.
echo 🚀 TO RUN THE APPLICATION:
echo.
echo 1. BACKEND (Terminal 1):
echo    .\env\Scripts\activate.bat
echo    python app.py
echo    (Should show: * Running on http://localhost:5001)
echo.
echo 2. FRONTEND (Terminal 2):
echo    cd "AudioGuard_flask 4_new\frontend"
echo    .\.venv\Scripts\activate.bat
echo    npm run dev
echo    (Should show: Local: http://localhost:5173)
echo.
echo 3. OPEN BROWSER:
echo    http://localhost:5173
echo.
echo ════════════════════════════════════════════════════════════
echo 🔒 Features:
echo   ✅ Audio Detection (deepfake analysis)
echo   ✅ Audio Regeneration
echo   ✅ AudioSeal Watermarking (embed & detect)
echo   ✅ Legal Report Integration
echo   ✅ Awareness & Education
echo ════════════════════════════════════════════════════════════
echo.
echo 📚 For detailed setup: See WATERMARKING_SETUP.md
echo.
pause
