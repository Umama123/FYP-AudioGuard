import numpy as np
import soundfile as sf
from pathlib import Path
from audio_watermarking import embed_watermark, detect_watermark
sr = 16000
length = 2.0
freq = 440
x = np.sin(2 * np.pi * freq * np.arange(int(sr * length)) / sr).astype(np.float32)
p = Path('test_sine.wav')
if p.exists():
    p.unlink()
sf.write(str(p), x, sr)
out = Path('test_sine_watermarked.wav')
if out.exists():
    out.unlink()
print('Embedding...')
res = embed_watermark(str(p), str(out), 'test_secret', sr)
print('Embed result:', res)
print('Detect original:')
print(detect_watermark(str(p), sr))
print('Detect watermarked:')
print(detect_watermark(str(out), sr))
