# AudioGuard Model Architecture & Pipeline Documentation

This document explains exactly how the deepfake detection models are structured, which files are used, and how they connect to the main `app.py` backend.

## 1. Overview of the Pipeline

When an audio file is uploaded to the backend via the `/api/detect` endpoint, the following sequence occurs:
1. `app.py` receives the file.
2. It passes the audio path to `classify_audio()`.
3. `classify_audio()` calls the `detect(audio_path)` method on `AASISTDetector`.
4. `AASISTDetector` loads the audio, processes it, and passes it through the PyTorch model (`original_model.py`).
5. The PyTorch model outputs prediction probabilities, which are then formatted and returned to the frontend.

---

## 2. Model Folder Contents (`models/`)

- **`models/aasist.py` (Active Wrapper)**
  - This is the main bridge file that connects the PyTorch model to `app.py`.
  - Inside this file is the `AASISTDetector` class. This class is responsible for loading the actual model weights, formatting the audio waveform exactly the way the model expects (64,600 samples, repeating or cropping), and extracting the `Deepfake Prob` and `Real Prob`.
  - It ignores the internal dummy `AASIST` class and directly imports the full architecture from `original_model.py`.

- **`original_model.py` (Active Architecture)**
  - This is the *real* engine of the AI. It contains the exact 598-line neural network architecture used by MTUCI/AASIST.
  - It defines the `Model` class, which handles the `RawNet2` encoder, `GraphAttentionLayer`, `HtrgGraphAttentionLayer`, and SSL features.
  - *Why this exists*: The model checkpoints (`.pth` files) were trained specifically on this architecture. The weights will only load successfully if this exact class structure is used.

- **`models/SSL_AntiSpoof/best_ssl_model.pth` (Active Weights)**
  - This is the primary trained PyTorch checkpoint loaded into `original_model.Model`. It contains all the learned weights and biases.

- **`models/aasist3.onnx` (Inactive)**
  - This is an ONNX version of the model that was previously used before we rolled back to the PyTorch implementation. It is no longer loaded by `app.py`.

- **`models/aasist_model.pth` (Inactive/Fallback)**
  - An alternative weights file. `app.py` scans a list of paths and defaults to `best_ssl_model.pth` if it finds it first.

- **`models/xls-r-300m/` (Active Dependency)**
  - Contains the pre-trained Wav2Vec2/XLSR weights used for extracting the base features before they are fed into the graph attention layers.

---

## 3. How `app.py` Connects

### Initialization (`_initialize_aasist_detector`)
When `app.py` starts up, it runs the `_initialize_aasist_detector()` function. 
1. It loops through a predefined list of paths looking for `.pth` model weights.
2. It finds `models/SSL_AntiSpoof/best_ssl_model.pth`.
3. It initializes the `AASISTDetector` class (from `models/aasist.py`) and passes the weights path to it.

### Classification (`classify_audio`)
When a file is scanned:
1. `app.py` calls `_aasist_detector.detect(audio_path)`.
2. The detector returns three variables: `is_deepfake`, `confidence`, and `score`.
3. `app.py` builds a JSON response mapping `is_deepfake = True` to the `"Deepfake"` label and setting the real and fake percentage ratios based strictly on the model's authentic confidence.

---

## 4. The "Hardcoded Probability" Issue (Fixed)

Previously, the model output appeared "hardcoded" or stuck on a default value for two distinct reasons:
1. **Manual Override**: The `app.py` file had a hardcoded `confidence = 83.0` line that overrode any output the model gave.
2. **Mock Architecture**: The old `models/aasist.py` file had a simplified, 56-line dummy `AASIST` class. Because it did not match the structure of `original_model.py`, PyTorch could not load the weights from `best_ssl_model.pth` correctly. As a result, the classification layer was left with *random, untrained weights*. This caused the model to effectively guess randomly (always outputting probabilities around 50-56% for every audio file).

**The Solution:**
- The manual `83.0` override in `app.py` was removed.
- `models/aasist.py` was updated to import the real `Model` class directly from `original_model.py`. Now, the weights load perfectly, and the model relies on actual learned intelligence to produce dynamic, accurate scores.
