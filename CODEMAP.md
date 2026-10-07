# Project Code Map - AudioGuard

Purpose
- Quick reference for the current active project under `FYP_2_AudioGuard`.
- This map reflects the actual workspace paths used by the current Flask backend.

## Workspace layout
- `.` - active app project root (Flask backend)
- `models/` - Model weights and wrappers
- `deepfake_intel_v2/` - Intelligence pipeline for awareness reports
- `Audios for testing/` - Test audios for the model
- `data/` - Datasets

## Backend (Flask)
- `app.py`
  - Main Flask entry point
  - Exposes API routes such as:
    - /api/detect
    - /api/enhance
    - /api/health
    - /api/watermarking/embed
    - /api/watermarking/detect
    - /api/intel/report

- `activity_store.py`
  - SQLite-backed activity and history tracking

- `evaluate_model.py`
  - Script for evaluating AASIST model accuracy on datasets (e.g. ASVspoof).

## Supporting backend modules
- `audio_watermarking.py` - Legacy/standalone watermarking engine
- `audioseal_watermark.py` - Alternative watermark implementation wrapper
- `extract_audio.py` - Utility for extracting audio from video files
- `generate_test_audio.py` - Script for generating test sine waves
- `models/aasist.py` - AASIST3 Deepfake detection model wrapper

## Build and run notes
- Backend server:
  - Start `app.py` with Python
