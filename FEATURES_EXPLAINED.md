# AudioGuard Features & How They Work

This document outlines the core features of the AudioGuard application, explaining what each feature does, the terms involved, and how it works under the hood.

---

## 1. Deepfake & AI Audio Detection (`/api/detect`)

**What it is:** 
The core feature of AudioGuard. It analyzes uploaded audio files to determine if they are authentic (real human voice) or synthetically generated (deepfakes/AI-generated).

**Key Terms:**
*   **AASIST3 Model:** A state-of-the-art deep learning model specifically designed for Anti-Spoofing (detecting synthetic speech and deepfakes).
*   **Librosa:** A Python library for audio and music analysis used to extract audio features.
*   **Features:** Characteristics of the audio signal such as:
    *   *MFCC (Mel-frequency cepstral coefficients):* Represents the short-term power spectrum of sound, essentially the "shape" of the voice.
    *   *Spectral Centroid:* Indicates where the "center of mass" of the spectrum is (brightness of the sound).
    *   *Zero-Crossing Rate (ZCR):* The rate at which the signal changes from positive to negative.
    *   *Pitch Consistency:* How stable the pitch is over time. Deepfakes often struggle with natural pitch variations.

**How it works:**
1.  The user uploads an audio file (WAV, MP3, FLAC, etc.).
2.  The backend extracts acoustic features (MFCC, ZCR, Spectral Centroid, etc.) using `librosa`.
3.  The audio is passed to the **AASIST3** model, which performs inference (analysis) and calculates a confidence score.
4.  The system returns the classification ("Real" or "Deepfake"), the confidence percentage, and the underlying extracted features.
5.  If enabled, it also triggers the Explainability module to generate visual spectrograms, and logs the activity in the database.

---

## 2. Audio Watermarking (`/api/watermarking/...`)

**What it is:**
A tool to embed an invisible, inaudible digital "signature" (watermark) into an audio file, and later detect it to verify the file's authenticity and origin.

**Key Terms:**
*   **Secret ID:** A unique identifier embedded into the audio signal.
*   **Embed:** The process of hiding the Secret ID within the audio file without degrading its perceptible quality.
*   **Detect/Extract:** The process of scanning an audio file to retrieve the hidden Secret ID.

**How it works:**
*   **Embedding (`/api/watermarking/embed`):** The user uploads a file and provides a `secret_id` (or one is auto-generated). The system uses the `audio_watermarking.py` module to embed this ID into the audio signal and returns a downloadable, watermarked version of the file.
*   **Detection (`/api/watermarking/detect`):** When a suspect audio file is uploaded, the system scans the audio signal to see if a watermark is present. If found, it extracts and returns the Secret ID, proving the file's origin.

---

## 3. Intelligence Reports (`/api/intel/...`)

**What it is:**
The "Aware & Sincere" threat intelligence feed. It provides daily updates on the latest deepfake trends, emerging threats, and mitigation strategies.

**Key Terms:**
*   **Intelligence Pipeline:** A background process (in `deepfake_intel_v2`) that gathers and compiles articles and data about deepfake threats.
*   **Markdown Reports:** The compiled intelligence is stored as Markdown files containing themes, key insights, and source references.

**How it works:**
1.  The backend fetches the latest generated intelligence report from the local file system.
2.  It parses the Markdown file to extract structured data: summary, top stories, key insights, emerging threats, and prevention methods.
3.  This structured data is sent to the frontend UI to display a comprehensive threat dashboard. Users can also manually trigger a refresh to run the pipeline and generate a new report.

---

## 4. Forensic & Legal Reporting (`/api/legal/...`)

**What it is:**
A feature designed to generate formal evidence reports for suspect audio files, suitable for submission to organizations, agencies, or legal entities.

**Key Terms:**
*   **Case ID:** A unique tracking number generated for the specific analysis (e.g., `CASE-20260927-A1B2C3`).
*   **Forensic Report:** A structured text document summarizing the AI analysis, confidence scores, and specific audio anomalies found.

**How it works:**
1.  After an audio file is flagged as a deepfake, the user can request to generate evidence.
2.  The backend compiles the detection results (status, confidence) and technical anomalies (e.g., "Spectral centroid and MFCC patterns show anomalies").
3.  It generates a formatted text draft addressed to the specified organization.
4.  The action is logged as an "Evidence Report" in the history tracker.

---

## 5. Audio Enhancement (`/api/enhance`)

**What it is:**
A feature to clean up noisy audio, removing background noise to make speech clearer. 

**Key Terms:**
*   **Denoise Strength:** How aggressively the algorithm tries to remove background noise.
*   **Quality/Epochs:** Parameters that dictate how much processing power/time is spent on enhancing the audio.

**How it works:**
1.  The user uploads an audio file and specifies parameters like `quality` and `denoiseStrength`.
2.  The backend processes the audio to suppress non-speech noise, aiming to restore the clarity of the primary voice.
3.  The enhanced audio is saved and made available for download or playback.

---

## 6. Activity & History Tracking (`activity_store.py`)

**What it is:**
A local database that keeps a log of all actions performed by the user in the app, such as scans, watermarking, and report generation.

**Key Terms:**
*   **SQLite:** A lightweight, file-based database used to store the logs locally.

**How it works:**
Whenever a major action occurs (e.g., a file is successfully scanned by the detector, a watermark is embedded, or an evidence report is generated), the backend calls `activity_store.log_detection()` or similar functions. These functions insert a record into the SQLite database with the filename, status, confidence score, and timestamp, allowing the user to view their past activity in the UI.

---

## 7. Explainability (`explainability.py`)

**What it is:**
A module that attempts to explain *why* the AI made its decision, providing visual evidence alongside the confidence score.

**Key Terms:**
*   **Spectrogram:** A visual representation of the spectrum of frequencies of a signal as it varies with time. Deepfakes often have visual artifacts in their spectrograms that are invisible in the raw waveform.

**How it works:**
During the detection phase, if the explainability module is available, it analyzes the extracted audio features and generates a visual report (like a spectrogram image or highlighted feature charts). This is returned with the detection result to help humans understand the AI's reasoning.
