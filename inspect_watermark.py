import numpy as np
import librosa
from pathlib import Path
from audio_watermarking import AudioWatermarker

sr = 16000
p = Path('test_sine.wav')
out = Path('test_sine_watermarked.wav')
if not p.exists() or not out.exists():
    raise SystemExit('need test files')
watermarker = AudioWatermarker(sample_rate=sr)

pattern = watermarker._generate_watermark_pattern(1000)
print('pattern sample', pattern[:20])

for name, path in [('orig', p), ('wm', out)]:
    audio, sr2 = librosa.load(str(path), sr=None, mono=True)
    audio = watermarker._resample_audio(audio, sr2)
    audio = watermarker._normalize_audio(audio)
    D = librosa.stft(audio, n_fft=watermarker.fft_size, hop_length=watermarker.hop_length)
    mag = np.abs(D)
    freq_bins = mag.shape[0]
    start = int(1000 * freq_bins / (watermarker.sample_rate/2))
    end = int(4000 * freq_bins / (watermarker.sample_rate/2))
    energy = np.mean(mag[start:end,:], axis=0)
    norm = (energy - np.mean(energy)) / (np.std(energy)+1e-8)
    corr = np.dot(norm, pattern[:len(norm)]) / ((np.linalg.norm(norm)*np.linalg.norm(pattern[:len(norm)]))+1e-8)
    print(name, 'len', len(energy), 'mean', np.mean(energy), 'std', np.std(energy), 'corr', corr)
    print(name, 'energy[0:20]', energy[:20])
    print(name, 'norm[0:20]', norm[:20])
