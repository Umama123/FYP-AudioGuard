import os
import subprocess
import sys

def main():
    clean_wav = "clean_speech.wav"
    noisy_wav = "extremely_noisy_speech.wav"
    
    # 1. Generate clean speech using PowerShell
    ps_script = f"""
    Add-Type -AssemblyName System.Speech
    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $synth.SetOutputToWaveFile('{os.path.abspath(clean_wav)}')
    $synth.Speak('Hello, this is a test audio file. I am speaking through a lot of background noise. Let us see if your audio enhancement algorithm can clean this up and make my voice clear.')
    $synth.Dispose()
    """
    
    print("Generating clean speech via Windows TTS...")
    subprocess.run(["powershell", "-Command", ps_script], check=True)
    
    # 2. Add noise
    try:
        import scipy.io.wavfile as wav
        import numpy as np
    except ImportError:
        print("Required libraries (scipy, numpy) not found. Trying to install them...")
        subprocess.run([sys.executable, "-m", "pip", "install", "scipy", "numpy"], check=True)
        import scipy.io.wavfile as wav
        import numpy as np
        
    print("Adding heavy noise...")
    sample_rate, data = wav.read(clean_wav)
    
    # Convert to float and mono
    if len(data.shape) > 1:
        data = data[:, 0]
    data_float = data.astype(np.float32)
    
    # Generate white noise
    noise = np.random.normal(0, 1, data_float.shape)
    
    # Calculate powers
    signal_power = np.mean(data_float ** 2)
    noise_power = np.mean(noise ** 2)
    
    # Target SNR (Signal to Noise Ratio) - 0dB means equal power, negative means noise is louder
    target_snr_db = -5.0 
    target_snr_linear = 10 ** (target_snr_db / 10.0)
    
    # Scale noise
    required_noise_power = signal_power / target_snr_linear
    noise = noise * np.sqrt(required_noise_power / noise_power)
    
    # Mix
    noisy_signal = data_float + noise
    
    # Normalize back to 16-bit PCM
    noisy_signal_norm = np.int16(noisy_signal / np.max(np.abs(noisy_signal)) * 32767)
    
    wav.write(noisy_wav, sample_rate, noisy_signal_norm)
    
    print(f"Success! Test file saved as: {os.path.abspath(noisy_wav)}")

if __name__ == "__main__":
    main()
