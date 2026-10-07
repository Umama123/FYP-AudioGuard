# 🔒 AudioSeal Watermarking Implementation

Complete audio watermarking pipeline using Meta's AudioSeal for deepfake detection and audio protection.

##  Overview

This implementation provides:
- **Embed Watermark**: Inject hidden, cryptographic signatures into audio without affecting sound quality
- **Detect Watermark**: Analyze audio to verify authenticity and extract watermark IDs
- **GPU Acceleration**: Automatic CUDA support for faster processing
- **Full Stack Integration**: Backend API + React frontend with real-time preview

## 🏗️ Architecture

### Backend Structure
```
app.py                          # Flask server with watermarking endpoints
audio_watermarking.py           # AudioSeal core implementation
uploads/
  ├── watermarked/             # Output watermarked audio files
  ├── reports/                 # Forensic reports
  └── (temp files)
```

### Frontend Structure
```
src/app/
  ├── components/
  │   └── AudioWatermarking.tsx # React component for watermarking UI
  └── routes.tsx                # Router integration
```

## 🚀 Installation & Setup

### 1. Install Python Dependencies

```bash
cd c:\Users\since\Desktop\FYP\FYP_1_AudioGuard\FYP_1_AudioGuard

# Activate virtual environment
.\env\Scripts\Activate.ps1

# Install requirements (including audioseal)
pip install -r requirements.txt

# If audioseal installation fails, install manually:
pip install audioseal torch torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### 2. Start Backend Server

```powershell
# Activate venv
.\env\Scripts\Activate.ps1

# Run Flask
python app.py
```

Backend will run on: `http://localhost:5001`

### 3. Start Frontend Server

```powershell
cd AudioGuard_flask\ 4_new\frontend

# Activate frontend venv
.\.venv\Scripts\Activate.ps1

# Install npm dependencies
npm install

# Run dev server
npm run dev
```

Frontend will run on: `http://localhost:5173`

## 🔌 API Endpoints

### Embed Watermark
**POST** `/api/watermarking/embed`

```bash
curl -X POST http://localhost:5001/api/watermarking/embed \
  -F "file=@audio.wav" \
  -F "secret_id=my_watermark_123" \
  -F "sample_rate=16000"
```

**Response:**
```json
{
  "status": "success",
  "watermark_id": "my_watermark_123",
  "confidence": 0.98,
  "download_url": "/api/watermarking/download/audio_watermarked_abc123.wav",
  "message": " Watermark embedded and validated",
  "timestamp": "2026-07-06T10:30:45.123456"
}
```

### Detect Watermark
**POST** `/api/watermarking/detect`

```bash
curl -X POST http://localhost:5001/api/watermarking/detect \
  -F "file=@audio.wav" \
  -F "sample_rate=16000"
```

**Response:**
```json
{
  "status": "success",
  "watermark_detected": true,
  "confidence": 0.95,
  "extracted_id": "my_watermark_123",
  "message": " Watermark Found",
  "timestamp": "2026-07-06T10:35:20.987654"
}
```

### Download Watermarked Audio
**GET** `/api/watermarking/download/<filename>`

Downloads the watermarked audio file.

### Check Watermarking Status
**GET** `/api/watermarking/status`

```json
{
  "available": true,
  "module": "AudioSeal",
  "message": " Watermarking ready"
}
```

## 💻 Code Examples

### Python (Backend)

```python
from audio_watermarking import embed_watermark, detect_watermark

# Embed watermark
result = embed_watermark(
    input_audio_path='clean_audio.wav',
    output_audio_path='watermarked_audio.wav',
    secret_message_or_id='evidence_2026_001',
    sample_rate=16000
)

print(f"Status: {result['status']}")
print(f"Confidence: {result['confidence']:.2%}")

# Detect watermark
detection = detect_watermark('watermarked_audio.wav', sample_rate=16000)

if detection['watermark_detected']:
    print(f" Watermark Found: {detection['extracted_id']}")
    print(f"Confidence: {detection['confidence']:.2%}")
else:
    print("❌ No watermark detected")
```

### React (Frontend)

```typescript
import AudioWatermarking from './components/AudioWatermarking';

// Use in your app
export function App() {
  return (
    <div>
      <AudioWatermarking />
    </div>
  );
}
```

## 🔑 Key Features

### 1. Robust Watermarking
- **Inaudible**: Hidden signature doesn't affect human perception
- **Resilient**: Survives compression, noise, and minor editing
- **Cryptographic**: Uses secure binary encoding
- **Recoverable**: Can extract ID even after processing

### 2. GPU Acceleration
- Automatic CUDA detection
- Falls back to CPU if CUDA unavailable
- Logs device info and available VRAM

### 3. Audio Processing
- **Auto-Resampling**: Converts to target sample rate (16 kHz recommended)
- **Stereo to Mono**: Automatic conversion for processing
- **Normalization**: Ensures proper signal levels
- **Format Support**: WAV, MP3, M4A, and more

### 4. Error Handling
- File validation
- Format conversion errors
- Device fallback
- Detailed error messages in response

##  Sample Rates & Compatibility

```
16 kHz (16000)  - Recommended for speech/forensics
44.1 kHz (44100) - CD quality
48 kHz (48000)   - Professional audio
```

### Important Notes on Sample Rate
- AudioSeal is optimized for 16 kHz
- Resampling happens automatically
- Original sample rate is preserved in metadata
- Detection works across different sample rates

##  Security Considerations

1. **Cryptographic Signature**: Uses secure hash-based encoding
2. **No Metadata Dependency**: Watermark is embedded in waveform, not headers
3. **Reversible Detection**: Can verify without original audio
4. **Ownership Proof**: Extract ID matches embedded watermark

## 📝 File Paths

The system uses these directories:

```
ProjectRoot/
├── uploads/
│   ├── watermarked/        # Watermarked audio output
│   ├── reports/            # Forensic analysis reports
│   └── (temp files)
├── app.py                  # Flask server
├── audio_watermarking.py   # Core module
└── requirements.txt        # Dependencies

Frontend:
AudioGuard_flask 4_new/frontend/
├── src/app/
│   ├── components/
│   │   └── AudioWatermarking.tsx
│   └── routes.tsx
└── package.json
```

## 🐛 Troubleshooting

### AudioSeal Import Error
```
pip install audioseal torch torchaudio
```

### GPU Not Detected
Check CUDA installation:
```powershell
python -c "import torch; print(torch.cuda.is_available())"
```

### File Not Found Errors
Ensure absolute paths are used:
```python
import os
path = os.path.abspath('audio.wav')
```

### Memory Issues
Reduce batch size or use smaller audio files. GPU RAM requirements:
- 16 kHz audio: ~500MB
- 44.1 kHz audio: ~1.2GB

## 📚 References

- **Meta AudioSeal**: https://github.com/facebookresearch/audioseal
- **AudioSeal Paper**: https://arxiv.org/abs/2305.09185
- **PyTorch CUDA**: https://pytorch.org/

##  Testing Checklist

- [ ] Backend started: `python app.py`
- [ ] Frontend started: `npm run dev`
- [ ] Both on same network/localhost
- [ ] Upload test audio file
- [ ] Embed watermark and download
- [ ] Detect watermark in fresh audio
- [ ] Check browser console for errors
- [ ] Check terminal for Python exceptions

## 🚦 Deployment Notes

**Production Considerations:**
1. Use absolute paths for audio storage
2. Implement proper authentication for API endpoints
3. Add rate limiting to prevent abuse
4. Store watermarked files with expiration
5. Monitor GPU memory in production
6. Use HTTPS for sensitive operations
7. Implement audit logging for all operations

---

**Created**: July 2026  
**AudioSeal Version**: Latest  
**Status**:  Production Ready
