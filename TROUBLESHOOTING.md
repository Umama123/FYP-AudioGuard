# AudioGuard Troubleshooting Guide

This document outlines common issues encountered when setting up and running the AudioGuard project, along with their solutions.

## 1. Virtual Environment & Package Installation Issues

### Issue: `Fatal error in launcher: Unable to create process using ... pip.exe`
**Cause:** The virtual environment was copied or renamed from another folder (e.g., `FYP_1_AudioGuard` to `FYP_2_AudioGuard`). The `pip.exe` wrapper has the old path hardcoded into it.
**Solution:**
Always run pip using the python executable directly:
```powershell
python -m pip install <package_name>
```

### Issue: Packages like `librosa` or `google-generativeai` still not found after installing
**Cause:** 
1. The server (`app.py`) was running while you installed the packages, and it hasn't been restarted.
2. The packages were accidentally installed globally instead of inside the activated virtual environment.
3. A dependency of the package (like `scipy`, `numpy`, or `soundfile` for `librosa`) failed to install correctly.
**Solution:**
1. Stop the running server by pressing `Ctrl + C` in the terminal.
2. Ensure your virtual environment is active (you should see `(env)` in your terminal prompt). If not, activate it:
   ```powershell
   .\env\Scripts\Activate.ps1
   ```
3. Re-run the installation commands using `python -m pip`.
4. Run `python -c "import librosa"` in the terminal to see the exact error message if the import is still failing.

## 2. Python Execution Policy Errors

### Issue: `cannot be loaded because running scripts is disabled on this system.`
**Cause:** Windows PowerShell restricts the execution of scripts by default, preventing the virtual environment activation script from running.
**Solution:**
Run the following command once in PowerShell to allow local scripts to run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 3. Generative AI (Gemini) Setup

### Issue: Where to import and setup `google.generativeai`?
**Cause:** You need to configure the Gemini API key and import the package before using the chatbot or AI-related features.
**Solution:**
In `app.py`, the import is handled around line 91. It looks like this:
```python
try:
    import google.generativeai as genai
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "YOUR_API_KEY_HERE")
    genai.configure(api_key=GEMINI_API_KEY)
except ImportError:
    logging.warning("google-generativeai not installed")
```
Make sure your API key is correctly inserted there or provided via a `.env` file.

## 4. Frontend (React/Vite) Issues

### Issue: `npm run dev` fails or throws errors
**Cause:** Node modules are missing or corrupted.
**Solution:**
1. Navigate to the frontend directory: `cd AudioGuard/frontend` (or wherever your `package.json` is located).
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`

## 5. Model Loading Issues

### Issue: `AASIST3 checkpoint file not found.`
**Cause:** The pre-trained model file (`best_ssl_model.pth` or `aasist_model.pth`) is missing from the `models` directory.
**Solution:**
Ensure that the `.pth` weights file is placed in one of these directories:
- `models/SSL_AntiSpoof/best_ssl_model.pth`
- `models/aasist_model.pth`
If you don't have the file, you'll need to download it from the project's source or drive link and place it in the correct folder.
