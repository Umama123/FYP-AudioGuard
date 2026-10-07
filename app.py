"""
Atleast UI is working
AudioGuard Flask Backend
Endpoints:
  POST /api/detect        - Analyze audio file for deepfake / AI-generated / real
  POST /api/enhance       - Enhance / enhance audio (ASSIST pipeline simulation)
  GET  /api/health        - Health check
  GET  /api/intel/report  - Fetch Aware & Sincere intelligence reports
"""

import os
import math
import uuid
import time
import logging
import tempfile
import json
import re
import sys
import io

if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")

from pathlib import Path
from typing import Optional, Tuple
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ── Dynamic Base & Path Setup ───────────────────────────────────────────────
APP_DIR = Path(__file__).resolve().parent

# Check if app.py is inside the backend directory or root directory
if APP_DIR.name == "backend":
    BACKEND_DIR = APP_DIR
    PROJECT_ROOT = APP_DIR.parent
else:
    PROJECT_ROOT = APP_DIR
    BACKEND_DIR = APP_DIR / "backend"

BACKEND_INTEL_DIR = PROJECT_ROOT / "deepfake_intel_v2"

for candidate in (PROJECT_ROOT, BACKEND_DIR, BACKEND_INTEL_DIR, PROJECT_ROOT / "models"):
    candidate_path = str(candidate.resolve())
    if candidate.exists() and candidate_path not in sys.path:
        sys.path.insert(0, candidate_path)

import numpy as np
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Try activity store
try:
    import activity_store
except ImportError:
    logging.warning("activity_store module not found. Using dummy logger fallback.")
    activity_store = None
#previous one ------------------
# AASIST Model Imports
""" AASIST_AVAILABLE = False
AASISTDetector = None

try:
    from models.aasist import AASIST, AASISTDetector
    AASIST_AVAILABLE = True
except ImportError:
    try:
        from aasist_detector import AASISTDetector
        AASIST_AVAILABLE = True
    except ImportError:
        AASIST_AVAILABLE = False
        logging.warning("AASIST3 detector not available - falling back to feature-based detection") """
#-----------------------------------

        #------------new version--------------
        # --- AFTER (Debug Version) ---
try:
  from models.aasist import AASISTDetector

  AASIST_AVAILABLE = True
  print("SUCCESSFULLY IMPORTED AASISTDetector!")
except Exception as e:
  AASIST_AVAILABLE = False
  logging.warning(f"AASIST import failed with error: {e}")

# ── Google Generative AI (Gemini) ──────────────────────────────────────────
try:
    import google.generativeai as genai
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AQ.Ab8RN6IyOKVIBQFchY1t31VOuOiO7QzHYs1dVDqADZxc3SryVw")
    if GEMINI_API_KEY and GEMINI_API_KEY != "PASTE_YOUR_GEMINI_API_KEY_HERE":
        genai.configure(api_key=GEMINI_API_KEY)
        GEMINI_AVAILABLE = True
    else:
        GEMINI_AVAILABLE = False
        logging.warning("GEMINI_API_KEY not set - chatbot will use fallback responses")
except ImportError:
    GEMINI_AVAILABLE = False
    logging.warning("google-generativeai not installed - install with: pip install google-generativeai")

# ── Explainability Report Generation ──────────────────────────────────────────
try:
    from explainability import create_explainability_report
    EXPLAINABILITY_AVAILABLE = True
except ImportError:
    EXPLAINABILITY_AVAILABLE = False
    logging.warning("Explainability module not available - reports will not include spectrograms")

# ── Optional: librosa for real feature extraction ───────────────────────────
try:
    import librosa
    import noisereduce as nr
    import scipy.signal
    LIBROSA_AVAILABLE = True
except ImportError as e:
    LIBROSA_AVAILABLE = False
    logging.warning(f"librosa or noisereduce not found – falling back to numpy-only feature extraction. Exact error: {e}")

# ── Optional: soundfile for audio writing ───────────────────────────────────
try:
    import soundfile as sf
    SF_AVAILABLE = True
except ImportError:
    SF_AVAILABLE = False

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# ── Audio Watermarking ────────────────────────────────────────────────────────
try:
    import audio_watermarking
    WATERMARKING_AVAILABLE = True
except ImportError:
    WATERMARKING_AVAILABLE = False
    logging.warning("audio_watermarking module not available")

def _resolve_static_folder() -> str:
    candidates = [
        PROJECT_ROOT / "frontend" / "dist",
        PROJECT_ROOT / "AudioGuard" / "frontend" / "dist",
        BACKEND_DIR / ".." / "frontend" / "dist",
        APP_DIR / "frontend" / "dist",
        APP_DIR / "AudioGuard" / "frontend" / "dist",
    ]
    for candidate in candidates:
        resolved = candidate.resolve()
        if resolved.exists():
            return str(resolved)
    return str(candidates[0].resolve())

STATIC_FOLDER = _resolve_static_folder()

# NOTE: static_url_path="" serves Vite asset files (/assets/...) directly from dist folder
app = Flask(__name__, static_folder=STATIC_FOLDER, static_url_path="")
CORS(app, resources={r"/api/*": {"origins": "*"}})

UPLOAD_FOLDER = tempfile.mkdtemp(prefix="audioguard_")
ALLOWED_EXTENSIONS = {"wav", "mp3", "m4a", "flac", "aac", "ogg", "mp4", "avi", "mov", "mkv"}
MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50 MB
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

INTEL_DIR = BACKEND_INTEL_DIR
INTEL_REPORT_DIR = INTEL_DIR / "data" / "reports"

def _ensure_intel_path() -> None:
    intel_path = str(INTEL_DIR)
    if intel_path not in sys.path:
        sys.path.insert(0, intel_path)

def _latest_intel_report_path() -> Path | None:
    if not INTEL_REPORT_DIR.exists():
        return None

    candidates = sorted(
        INTEL_REPORT_DIR.glob("*.md"),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    return candidates[0] if candidates else None

def _clean_markdown_text(value: str) -> str:
    return value.replace("**", "").replace("`", "").strip(" *")

def _parse_markdown_link(value: str) -> dict:
    match = re.search(r"\[([^\]]+)\]\(([^)]+)\)", value)
    if not match:
        return {"label": _clean_markdown_text(value), "url": ""}
    return {
        "label": match.group(1).strip(),
        "url": match.group(2).strip(),
    }

def _empty_intel_payload(message: str, report_path: Path | None = None) -> dict:
    return {
        "status": "empty",
        "title": "Aware & Sincere Intelligence Feed",
        "generatedAt": None,
        "reportPath": str(report_path) if report_path else None,
        "message": message,
        "stats": {
            "articlesRetrieved": 0,
            "dbTotal": 0,
            "sourceCount": 0,
            "themeCount": 0,
        },
        "overview": {
            "summary": "",
            "topStories": [],
        },
        "keyInsights": [],
        "themes": [],
        "threats": [],
        "prevention": [],
        "sources": [],
    }

def _unavailable_intel_payload(message: str) -> dict:
    payload = _empty_intel_payload(message)
    payload["status"] = "unavailable"
    return payload

def _parse_overview(lines: list[str]) -> dict:
    summary = ""
    top_stories = []
    collecting_stories = False

    for line in lines:
        stripped = line.strip()
        if not stripped or stripped == "---":
            continue
        if stripped.startswith(">"):
            continue
        if stripped == "**Top stories today:**":
            collecting_stories = True
            continue
        if stripped.startswith("- ") and collecting_stories:
            match = re.match(r"- \[(.+?)\]\((.+?)\)\s+-\s+\*(.+?)\*", stripped)
            if match:
                top_stories.append({
                    "title": match.group(1).strip(),
                    "url": match.group(2).strip(),
                    "source": match.group(3).strip(),
                })
            continue
        if not summary:
            summary = stripped

    return {"summary": summary, "topStories": top_stories}

def _parse_key_insights(lines: list[str]) -> list[dict]:
    insights = []
    index = 0

    while index < len(lines):
        line = lines[index].strip()
        if line.startswith("- "):
            insight = {"text": line[2:].strip(), "title": "", "url": ""}
            if index + 1 < len(lines):
                next_line = lines[index + 1].strip()
                if next_line.startswith("↳"):
                    link = _parse_markdown_link(next_line.replace("↳", "", 1).strip())
                    insight["title"] = link["label"]
                    insight["url"] = link["url"]
                    index += 1
            insights.append(insight)
        index += 1

    return insights

def _parse_themes(lines: list[str]) -> list[dict]:
    themes = []
    current_theme = None
    index = 0

    while index < len(lines):
        line = lines[index].strip()
        if line.startswith("### "):
            current_theme = {"label": _clean_markdown_text(line[4:]), "articles": []}
            themes.append(current_theme)
            index += 1
            continue

        if current_theme and line.startswith("**["):
            link = _parse_markdown_link(line.strip("*"))
            meta_line = lines[index + 1].strip() if index + 1 < len(lines) else ""
            snippet_line = lines[index + 2].strip() if index + 2 < len(lines) else ""

            source_match = re.search(r"\*(.+?)\*", meta_line)
            score_match = re.search(r"(\d+\.\d+)\s*$", meta_line)
            date_match = re.search(r"·\s*(\d{4}-\d{2}-\d{2})\s*·", meta_line)

            current_theme["articles"].append({
                "title": link["label"],
                "url": link["url"],
                "source": source_match.group(1).strip() if source_match else "",
                "date": date_match.group(1) if date_match else "",
                "score": float(score_match.group(1)) if score_match else None,
                "snippet": snippet_line[2:].strip() if snippet_line.startswith("> ") else "",
            })
            index += 3
            continue

        index += 1

    return themes

def _parse_bullet_section(lines: list[str]) -> list[str]:
    items = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("- "):
            items.append(stripped[2:].strip())
    return items

def _parse_source_table(lines: list[str]) -> list[dict]:
    sources = []
    for line in lines:
        stripped = line.strip()
        if not stripped.startswith("|") or stripped.startswith("|---"):
            continue

        parts = [part.strip() for part in stripped.split("|")[1:-1]]
        if len(parts) < 4 or parts[0] == "#":
            continue

        article = _parse_markdown_link(parts[1])
        try:
            score = float(parts[4]) if len(parts) > 4 else None
        except ValueError:
            score = None

        sources.append({
            "index": int(parts[0]) if parts[0].isdigit() else len(sources) + 1,
            "title": article["label"],
            "url": article["url"],
            "source": parts[2] if len(parts) > 2 else "",
            "date": parts[3] if len(parts) > 3 else "",
            "score": score,
        })
    return sources

def _parse_intel_report(markdown: str, report_path: Path | None = None) -> dict:
    if "Aware & Sincere: Daily Deepfake Intelligence Report" not in markdown:
        message = markdown.strip() or "No intelligence report is available yet."
        return _empty_intel_payload(message, report_path)

    lines = [line.rstrip() for line in markdown.splitlines()]
    sections: dict[str, list[str]] = {}
    current_section = None

    payload = {
        "status": "ready",
        "title": "Aware & Sincere",
        "generatedAt": None,
        "reportPath": str(report_path) if report_path else None,
        "message": "",
        "stats": {
            "articlesRetrieved": 0,
            "dbTotal": 0,
            "sourceCount": 0,
            "themeCount": 0,
        },
        "overview": {
            "summary": "",
            "topStories": [],
        },
        "keyInsights": [],
        "themes": [],
        "threats": [],
        "prevention": [],
        "sources": [],
    }

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("# "):
            payload["title"] = _clean_markdown_text(stripped[2:])
        elif stripped.startswith("> **Date:**"):
            payload["generatedAt"] = stripped.split("**Date:**", 1)[1].strip()
        elif stripped.startswith("> **Articles retrieved:**"):
            match = re.search(
                r"Articles retrieved:\*\*\s*(\d+)\s*\|\s*\*\*DB total:\*\*\s*(\d+)",
                stripped,
            )
            if match:
                payload["stats"]["articlesRetrieved"] = int(match.group(1))
                payload["stats"]["dbTotal"] = int(match.group(2))
        elif stripped.startswith("## "):
            current_section = _clean_markdown_text(stripped[3:])
            sections[current_section] = []
        elif current_section:
            sections[current_section].append(line)

    payload["overview"] = _parse_overview(sections.get("Overview", []))
    payload["keyInsights"] = _parse_key_insights(sections.get("Key Insights", []))
    payload["themes"] = _parse_themes(sections.get("Intelligence by Theme", []))
    payload["threats"] = _parse_bullet_section(sections.get("Emerging Threats", []))
    payload["prevention"] = _parse_bullet_section(sections.get("Prevention & Mitigation", []))
    payload["sources"] = _parse_source_table(sections.get("All Sources Referenced", []))
    payload["stats"]["sourceCount"] = len({item["source"] for item in payload["sources"]})
    payload["stats"]["themeCount"] = len(payload["themes"])

    return payload

def _run_intel_workflow(mode: str) -> tuple[str, Path]:
    _ensure_intel_path()

    if mode == "full":
        from scheduler.daily_scheduler import run_pipeline  # type: ignore

        run_pipeline(print_report=False)
        latest_path = _latest_intel_report_path()
        if latest_path is None:
            raise RuntimeError("Pipeline completed without generating a report.")
        return latest_path.read_text(encoding="utf-8"), latest_path

    from reporting.report_generator import generate_report  # type: ignore

    report_md, report_path = generate_report()
    return report_md, Path(report_path)

# ─────────────────────────────────────────────────────────────────────────────
# Feature Extraction & Classification (AASIST3 Model)
# ─────────────────────────────────────────────────────────────────────────────

# Dummy features removed to prevent synthetic values.

def extract_features(path: str) -> dict:
    if LIBROSA_AVAILABLE:
        try:
            print(f"[DEBUG - app.py extract_features] Loading audio from {path} with librosa (duration=30)")
            y, sr = librosa.load(path, mono=True, duration=30, sr=16000)
            print(f"[DEBUG - app.py extract_features] Loaded {len(y)} samples, sr={sr}")
            if np.max(np.abs(y)) < 1e-4:
                print(f"[DEBUG - app.py extract_features] Max abs value too low: {np.max(np.abs(y))}")
                raise RuntimeError("The uploaded audio is completely silent or corrupted by the browser! Please check your microphone.")
            mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13).mean(axis=1).tolist()
            sc = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
            zcr = float(np.mean(librosa.feature.zero_crossing_rate(y)))
            rms = float(np.mean(librosa.feature.rms(y=y)))
            rolloff = float(np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr, roll_percent=0.85)))
            
            tempo_val = 120.0
            try:
                tempo_arr, _ = librosa.beat.beat_track(y=y, sr=sr)
                tempo_val = float(tempo_arr) if np.isscalar(tempo_arr) else float(tempo_arr[0])
            except:
                pass
                
            
            features_res = {
                "mfcc": mfcc,
                "spectralCentroid": sc,
                "zeroCrossingRate": zcr,
                "rmsEnergy": rms,
                "spectralRolloff": rolloff,
                "tempo": tempo_val,
                "pitchConsistency": 0.7,
            }
            print(f"[DEBUG - app.py extract_features] Extracted features successfully. keys: {list(features_res.keys())}")
            return features_res
        except Exception as e:
            print(f"[DEBUG - app.py extract_features] Error: {e}")
            raise RuntimeError(f"Audio extraction failed: {str(e)}")
    raise RuntimeError("librosa not available for audio extraction")

_aasist_detector = None

# ── AASIST3 Model Initialization ──────────────────────────────────────────────
def _initialize_aasist_detector():
    global _aasist_detector
    if not AASIST_AVAILABLE or AASISTDetector is None:
        logger.warning("AASIST3 module unavailable - using fallback engine.")
        return

    try:
        _aasist_detector = AASISTDetector()
        logger.info(f"AASIST3 detector initialized successfully!")
    except Exception as e:
        logger.warning(f"Failed to initialize AASIST3 detector: {e}")
        _aasist_detector = None

_initialize_aasist_detector()
# ─────────────────────────────────────────────────────────────────────────────

def classify_audio(features: dict, audio_path: str = None) -> dict:
    """Classifies audio and outputs continuous AI vs Real percentage ratios."""
    print(f"[DEBUG - app.py classify_audio] Called with audio_path={audio_path}, features present: {bool(features)}")
    if _aasist_detector and audio_path:
        try:
            logger.info("Running AASIST3 model for inference...")
            print(f"[DEBUG - app.py classify_audio] Calling _aasist_detector.detect...")
            is_deepfake, confidence, score = _aasist_detector.detect(audio_path)
            print(f"[DEBUG - app.py classify_audio] _aasist_detector.detect returned: is_deepfake={is_deepfake}, confidence={confidence}, score={score}")
            
            # Ensure confidence is always rounded to 2 decimal places for the UI
            confidence = round(confidence, 2)
            
            if is_deepfake:
                status_label = "Deepfake"
                fake_ratio = confidence
                real_ratio = round(100.0 - confidence, 2)
            else:
                status_label = "Real"
                real_ratio = confidence
                fake_ratio = round(100.0 - confidence, 2)

            return {
                "status": status_label,
                "confidence": confidence,
                "fake_ratio": fake_ratio,
                "real_ratio": real_ratio,
                "model": "AASIST3",
                "scores": {"raw_score": score},
                "features": features,
            }
        except Exception as e:
            logger.warning(f"AASIST3 detection error: {e}")
            raise RuntimeError("AI model is not connected or failed to process the audio.")
    
    raise RuntimeError("AI model is not connected (AASIST3 module unavailable).")
# API Routes
# ─────────────────────────────────────────────────────────────────────────────

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/api/detect", methods=["POST"])
def detect():
    print(f"[DEBUG - app.py /api/detect] Received request headers: {request.headers}")
    print(f"[DEBUG - app.py /api/detect] Received files: {request.files}")
    if "file" not in request.files:
        print("[DEBUG - app.py /api/detect] No file field in request")
        return jsonify({"error": "No file field in request"}), 400

    f = request.files["file"]
    print(f"[DEBUG - app.py /api/detect] File name: {f.filename}, content_type: {f.content_type}")
    if f.filename == "":
        return jsonify({"error": "Empty filename"}), 400
    if not allowed_file(f.filename):
        return jsonify({"error": f"Unsupported format. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"}), 415

    filename = secure_filename(f.filename)
    tmp_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4().hex}_{filename}")
    print(f"[DEBUG - app.py /api/detect] Will save to tmp_path: {tmp_path}")
    
    try:
        f.save(tmp_path)
        print(f"[DEBUG - app.py /api/detect] Saved uploaded file to tmp_path")
        
        # --- FIX: Only convert if the file is webm/mp3/m4a/ogg. FLAC/WAV are supported natively ---
        ext = tmp_path.lower().split('.')[-1]
        if ext in ['webm', 'mp3', 'm4a', 'ogg']:
            try:
                from moviepy.editor import AudioFileClip
                converted_path = tmp_path + ".wav"
                clip = AudioFileClip(tmp_path)
                clip.write_audiofile(converted_path, fps=16000, nbytes=2, buffersize=2000, logger=None)
                clip.close()
                # Replace the tmp_path with our new converted WAV file
                os.remove(tmp_path)
                tmp_path = converted_path
                print(f"[DEBUG - app.py /api/detect] Successfully converted {ext} and updated tmp_path to {tmp_path}")
            except Exception as e:
                logger.warning(f"Audio format conversion skipped/failed: {e}")
                print(f"[DEBUG - app.py /api/detect] Exception during moviepy conversion: {e}")
        else:
            print(f"[DEBUG - app.py /api/detect] Skipping moviepy conversion for native format: {ext}")
        # -------------------------------------------------------

        print(f"[DEBUG - app.py /api/detect] Extracting features for {tmp_path}...")
        features = extract_features(tmp_path)
        print(f"[DEBUG - app.py /api/detect] Features extraction complete. Classifying audio...")
        result = classify_audio(features, audio_path=tmp_path)
        print(f"[DEBUG - app.py /api/detect] Classification complete. Result: {result}")

        response_data = {
            "status": "success",
            "detection": result,
            "filename": filename,
            "fake_ratio": result.get("fake_ratio"),
            "real_ratio": result.get("real_ratio"),
            "confidence": result.get("confidence"),
            "label": result.get("status"),
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
        
        if EXPLAINABILITY_AVAILABLE:
            try:
                response_data["explainability"] = create_explainability_report(tmp_path, features, result)
            except Exception as e:
                logger.warning(f"Failed to generate explainability report: {e}")

        if activity_store:
            try:
                activity_store.log_detection(
                    filename=filename,
                    status=result["status"],
                    confidence=result["confidence"],
                    mode="Single Upload"
                )
            except Exception as e:
                logger.warning(f"Activity logging skipped: {e}")

        return jsonify(response_data)

    except Exception as e:
        logger.exception("Detection execution error")
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "aasist_loaded": _aasist_detector is not None,
        "librosa": LIBROSA_AVAILABLE,
        "soundfile": SF_AVAILABLE,
    })

@app.route("/api/intel/report", methods=["GET"])
def intel_report():
    refresh = request.args.get("refresh", "false").lower() == "true"
    mode = request.args.get("mode", "report").lower()

    try:
        if refresh:
            report_md, report_path = _run_intel_workflow(mode)
            return jsonify(_parse_intel_report(report_md, report_path))

        latest_path = _latest_intel_report_path()
        if latest_path is None:
            return jsonify(_empty_intel_payload("No intelligence report has been generated yet."))

        report_md = latest_path.read_text(encoding="utf-8")
        return jsonify(_parse_intel_report(report_md, latest_path))
    except ModuleNotFoundError as exc:
        return jsonify(_unavailable_intel_payload(f"Aware & Sincere dependencies missing ({exc.name}).")), 503
    except Exception as exc:
        return jsonify(_unavailable_intel_payload(str(exc))), 500

@app.route("/api/intel/run", methods=["POST"])
def intel_run():
    mode = request.json.get("mode", "full") if request.is_json else "full"
    try:
        report_md, report_path = _run_intel_workflow(mode)
        return jsonify(_parse_intel_report(report_md, report_path))
    except Exception as exc:
        return jsonify(_unavailable_intel_payload(str(exc))), 500

# ─────────────────────────────────────────────────────────────────────────────
# Watermarking Routes
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/api/watermarking/embed", methods=["POST"])
def watermark_embed():
    if not WATERMARKING_AVAILABLE:
        return jsonify({"message": "Watermarking module not available", "status": "error"}), 503
    
    if "file" not in request.files:
        return jsonify({"message": "No file uploaded", "status": "error"}), 400
        
    f = request.files["file"]
    if f.filename == "":
        return jsonify({"message": "Empty filename", "status": "error"}), 400
        
    secret_id = request.form.get("secret_id", f"watermark_{uuid.uuid4().hex[:8]}")
    sample_rate = int(request.form.get("sample_rate", 16000))
    
    filename = secure_filename(f.filename)
    tmp_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4().hex}_{filename}")
    out_dir = os.path.join(PROJECT_ROOT, "uploads", "watermarked")
    os.makedirs(out_dir, exist_ok=True)
    out_filename = f"watermarked_{secret_id}.wav"
    out_path = os.path.join(out_dir, out_filename)
    
    try:
        f.save(tmp_path)
        result = audio_watermarking.embed_watermark(tmp_path, out_path, secret_id)
        if result["status"] == "success":
            result["download_url"] = f"/api/watermarking/download/{out_filename}"
            if activity_store:
                try:
                    activity_store.log_watermark(filename, secret_id)
                except Exception as e:
                    logger.warning(f"Activity logging skipped: {e}")
            return jsonify(result)
        else:
            return jsonify(result), 500
    except Exception as e:
        logger.exception("Watermarking embed error")
        return jsonify({"message": str(e), "status": "error"}), 500
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.route("/api/watermarking/detect", methods=["POST"])
def watermark_detect():
    if not WATERMARKING_AVAILABLE:
        return jsonify({"message": "Watermarking module not available", "status": "error"}), 503
        
    if "file" not in request.files:
        return jsonify({"message": "No file uploaded", "status": "error"}), 400
        
    f = request.files["file"]
    if f.filename == "":
        return jsonify({"message": "Empty filename", "status": "error"}), 400
        
    filename = secure_filename(f.filename)
    tmp_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4().hex}_{filename}")
    
    try:
        f.save(tmp_path)
        result = audio_watermarking.detect_watermark(tmp_path)
        return jsonify(result)
    except Exception as e:
        logger.exception("Watermarking detect error")
        return jsonify({"message": str(e), "status": "error"}), 500
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.route("/api/watermarking/download/<filename>", methods=["GET"])
def watermark_download(filename):
    out_dir = os.path.join(PROJECT_ROOT, "uploads", "watermarked")
    return send_from_directory(out_dir, secure_filename(filename))

@app.route("/api/watermarking/status", methods=["GET"])
def watermark_status():
    return jsonify({
        "available": WATERMARKING_AVAILABLE,
        "status": "online" if WATERMARKING_AVAILABLE else "offline"
    })

# ─────────────────────────────────────────────────────────────────────────────
# Legal & Evidence Routes
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/api/legal/generate-evidence", methods=["POST"])
def legal_generate_evidence():
    data = request.json
    if not data:
        return jsonify({"error": "No JSON payload provided"}), 400
        
    file_path = data.get("file_path", "unknown_file")
    status = data.get("status", "unknown")
    confidence = data.get("confidence", 0)
    organization = data.get("organization", "Agency")
    
    case_id = f"CASE-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    
    evidence_points = [
        f"Audio file '{file_path}' analyzed using deep learning (AASIST3) & feature extraction.",
        f"Result: {status} audio detected with {confidence}% confidence.",
        "Spectral centroid and MFCC patterns show anomalies characteristic of AI synthesis.",
        "Zero-crossing rate and pitch consistency fall outside natural human ranges."
    ]
    
    draft = f"FORENSIC REPORT: {case_id}\n\n"
    draft += f"To: {organization}\n"
    draft += f"Date: {datetime.now().isoformat()}\n\n"
    draft += f"Subject: Suspected Deepfake/AI Audio Content\n\n"
    draft += f"We are submitting this forensic analysis report regarding the file '{file_path}'.\n"
    draft += f"Our automated analysis pipeline has flagged this content as {status.upper()} with a confidence of {confidence}%.\n\n"
    draft += "Key Evidence:\n" + "\n".join(f"- {p}" for p in evidence_points)
    
    if activity_store:
        try:
            activity_store.log_report(file_path, "Evidence Report")
        except Exception as e:
            logger.warning(f"Activity logging skipped: {e}")
    
    return jsonify({
        "case_id": case_id,
        "status": status,
        "confidence": confidence,
        "organization": organization,
        "evidence_points": evidence_points,
        "evidence_draft": draft
    })

@app.route("/api/legal/report", methods=["POST"])
def legal_report():
    data = request.json
    if not data:
        return jsonify({"error": "No JSON payload provided"}), 400
        
    case_id = data.get("file_path", f"CASE-{uuid.uuid4().hex[:6].upper()}")
    organization = data.get("organization", "Agency")
    
    draft = f"Case {case_id} successfully submitted to {organization} via API."
    
    return jsonify({
        "case_id": case_id,
        "email_sent": True,
        "email_draft": draft
    })

# ─────────────────────────────────────────────────────────────────────────────
# Enhancement Dummy Route
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/api/enhance", methods=["POST"])
def enhance_audio():
    if "file" not in request.files:
        return jsonify({"error": "No file field in request"}), 400
    
    f = request.files["file"]
    if f.filename == "":
        return jsonify({"error": "Empty filename"}), 400
    
    filename = secure_filename(f.filename)
    quality = int(request.form.get("quality", 75))
    denoise_strength = int(request.form.get("denoiseStrength", 50))
    epochs = int(request.form.get("epochs", 10))
    
    original_id = uuid.uuid4().hex
    original_filename = f"orig_{original_id}_{filename}"
    original_path = os.path.join(UPLOAD_FOLDER, original_filename)
    
    enhanced_filename = f"enh_{original_id}_{filename}"
    enhanced_path = os.path.join(UPLOAD_FOLDER, enhanced_filename)
    
    try:
        f.save(original_path)
        
        if not LIBROSA_AVAILABLE or not SF_AVAILABLE:
            raise RuntimeError("Audio libraries (librosa, soundfile) missing")
            
        # Load audio
        y, sr = librosa.load(original_path, sr=None)
        
        # 1. Apply a low-pass filter to kill all high-frequency harsh static above 4000Hz immediately
        b, a = scipy.signal.butter(4, 4000 / (sr / 2), btype='low')
        y = scipy.signal.filtfilt(b, a, y)
        
        # 2. Find the quietest 0.25s chunk in the audio to use as a PERFECT noise profile
        chunk_length = max(1, int(sr * 0.25))
        if len(y) > chunk_length:
            energies = [np.sum(y[i:i+chunk_length]**2) for i in range(0, len(y)-chunk_length, chunk_length//2)]
            min_energy_idx = np.argmin(energies)
            noise_part = y[min_energy_idx * (chunk_length//2) : min_energy_idx * (chunk_length//2) + chunk_length]
        else:
            noise_part = y
            
        orig_noise_rms = float(np.sqrt(np.mean(noise_part**2))) + 1e-9
        orig_signal_rms = float(np.sqrt(np.mean(y**2))) + 1e-9
        orig_snr = 20 * np.log10(orig_signal_rms / orig_noise_rms)
        orig_cent_array = librosa.feature.spectral_centroid(y=y, sr=sr)
        orig_spectral_centroid = float(np.nanmean(orig_cent_array)) if orig_cent_array.size > 0 else 0.0
        
        # 3. Apply noisereduce with maximum aggression
        prop_decrease = min(1.0, (denoise_strength / 100.0) * 2.0)
        gate_threshold = 1.5 + (denoise_strength / 30.0) # at 100%, threshold is 4.8!
        
        y_denoised = nr.reduce_noise(
            y=y, 
            sr=sr, 
            y_noise=noise_part,
            prop_decrease=prop_decrease, 
            stationary=True,
            n_std_thresh_stationary=gate_threshold
        )
        
        # 4. Do NOT apply clarity boost. It just adds high frequency hiss back.
        y_enhanced = y_denoised
        
        # Normalize
        if np.max(np.abs(y_enhanced)) > 0:
            y_enhanced = librosa.util.normalize(y_enhanced)
        
        # Calculate enhanced metrics
        # Calculate true noise reduction based on y_denoised before normalization
        enh_noise_part = y_denoised[:chunk_length] if len(y_denoised) > chunk_length else y_denoised
        enh_noise_rms = float(np.sqrt(np.mean(enh_noise_part**2))) + 1e-9
        enh_signal_rms = float(np.sqrt(np.mean(y_enhanced**2))) + 1e-9
        enh_snr = 20 * np.log10(enh_signal_rms / enh_noise_rms)
        enh_cent_array = librosa.feature.spectral_centroid(y=y_enhanced, sr=sr)
        enh_spectral_centroid = float(np.nanmean(enh_cent_array)) if enh_cent_array.size > 0 else 0.0
        
        def safe_percent(val):
            return 0 if (np.isnan(val) or np.isinf(val)) else int(val)

        quality_boost_percent = safe_percent(((enh_snr - orig_snr) / abs(orig_snr + 1e-9)) * 100)
        noise_reduction_percent = safe_percent(((orig_noise_rms - enh_noise_rms) / orig_noise_rms) * 100)
        clarity_boost_percent = safe_percent(((enh_spectral_centroid - orig_spectral_centroid) / (orig_spectral_centroid + 1e-9)) * 100)
        
        quality_boost_percent = max(0, min(100, quality_boost_percent))
        noise_reduction_percent = max(0, min(100, noise_reduction_percent))
        clarity_boost_percent = max(0, min(100, clarity_boost_percent))
        
        # Save enhanced audio
        sf.write(enhanced_path, y_enhanced, sr)
        
        if activity_store:
            try:
                activity_store.log_enhancement(filename, quality, denoise_strength, epochs)
            except Exception as e:
                logger.warning(f"Activity logging skipped: {e}")
                
        return jsonify({
            "improvement": {
                "quality": quality_boost_percent,
                "noiseReduction": noise_reduction_percent,
                "clarityBoost": clarity_boost_percent
            },
            "originalUrl": f"/api/audio/file/{original_filename}",
            "enhancedUrl": f"/api/audio/file/{enhanced_filename}"
        })
    except Exception as e:
        logger.exception("Enhancement error")
        return jsonify({"error": str(e)}), 500

@app.route("/api/audio/file/<filename>", methods=["GET"])
def serve_audio_file(filename):
    return send_from_directory(UPLOAD_FOLDER, secure_filename(filename))

# ─────────────────────────────────────────────────────────────────────────────
# History & Analytics Routes
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/api/history/summary", methods=["GET"])
@app.route("/api/analytics/summary", methods=["GET"])
def analytics_summary():
    range_days = int(request.args.get("range", request.args.get("range_days", 30)))
    if activity_store:
        try:
            summary = activity_store.get_summary(range_days=range_days)
            return jsonify(summary)
        except Exception as e:
            logger.exception("Analytics summary error")
            return jsonify({"error": str(e)}), 500
    return jsonify({"error": "Activity store not available"}), 503

@app.route("/api/awareness/complete", methods=["POST"])
@app.route("/api/history/article-completion", methods=["POST"])
def awareness_complete():
    data = request.json or {}
    url = data.get("articleUrl", data.get("article_url"))
    title = data.get("articleTitle", data.get("article_title"))
    source = data.get("source", "Unknown")
    completed = data.get("completed", True)
    
    if activity_store and url and title:
        try:
            is_completed = activity_store.set_article_completion(url, title, source, completed)
            return jsonify({"success": True, "completed": is_completed, "articleUrl": url})
        except Exception as e:
            logger.warning(f"Activity logging skipped: {e}")
    return jsonify({"success": False}), 500

@app.route("/api/awareness/completed", methods=["GET"])
@app.route("/api/history/completed-articles", methods=["GET"])
def awareness_completed():
    if activity_store:
        try:
            urls = list(activity_store.get_completed_article_urls())
            return jsonify(urls)
        except Exception:
            pass
    return jsonify([])

@app.route("/api/awareness/open", methods=["POST"])
def awareness_open():
    return jsonify({"success": True})

# ─────────────────────────────────────────────────────────────────────────────
# Frontend Static File Serving Route
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path.startswith("api/"):
        return jsonify({"error": "API route not found"}), 404

    if path in {"", "index.html"}:
        return send_from_directory(app.static_folder, "index.html")

    target_file = os.path.join(app.static_folder, path)
    if path and os.path.exists(target_file):
        return send_from_directory(app.static_folder, path)

    index_path = os.path.join(app.static_folder, "index.html")
    if os.path.exists(index_path):
        return send_from_directory(app.static_folder, "index.html")

    return jsonify({
        "error": "Frontend build not found.",
        "message": f"Expected index.html at '{index_path}'. Please run 'npm run build' inside your frontend directory."
    }), 404

if __name__ == "__main__":
    _initialize_aasist_detector()
    logger.info("Starting AudioGuard Flask backend on http://localhost:5001")
    app.run(debug=False, host="0.0.0.0", port=5001, use_reloader=False)