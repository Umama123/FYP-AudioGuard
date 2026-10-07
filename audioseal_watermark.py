import os
import torch
import torchaudio
from pydub import AudioSegment
from audioseal import AudioSeal
import io

# Strictly enforce CPU execution
device = torch.device("cpu")
print(f"⚙️ Framework Target: {device.type.upper()}")

# Load AudioSeal models to CPU
try:
    GENERATOR = AudioSeal.load_generator("audioseal_wm_16bits").to(device)
    DETECTOR = AudioSeal.load_detector("audioseal_wm_16bits").to(device)
except Exception as e:
    GENERATOR = None
    DETECTOR = None
    print(f" Failed to load AudioSeal models: {e}")


def load_any_format(file_path):
    """
    Loads .wav, .mp3, or .flac files, standardizes them to 16kHz mono,
    and returns a PyTorch tensor ready for the AI model.
    """
    ext = os.path.splitext(file_path)[-1].lower().replace(".", "")
    if ext not in ["wav", "mp3", "flac"]:
        raise ValueError(f"❌ Unsupported format: .{ext}. Please use wav, mp3, or flac.")
    
    print(f"📥 Loading and decoding cross-format stream: {os.path.basename(file_path)}")
    
    # Read any format using pydub
    audio = AudioSegment.from_file(file_path, format=ext)
    
    # Core preprocessing standard: Convert to Mono and 16000Hz Sample Rate
    audio = audio.set_channels(1).set_frame_rate(16000)
    
    # Convert pydub raw data directly into an in-memory byte buffer for torch
    buffer = io.BytesIO()
    audio.export(buffer, format="wav")
    buffer.seek(0)
    
    wav, sr = torchaudio.load(buffer)
    return wav, sr


def embed_universal_watermark(input_path, output_path):
    """
    Takes any audio format (wav/mp3/flac), embeds an invisible watermark,
    and exports it cleanly matching your desired output format target.
    """
    if GENERATOR is None:
        raise RuntimeError("AudioSeal generator is not loaded. Cannot embed watermark.")

    if not os.path.exists(input_path):
        print(f"❌ Error: Source file {input_path} missing.")
        return

    # 1. Load and automatically normalize the audio layout
    wav, sr = load_any_format(input_path)
    if wav.dim() == 1:
        wav = wav.unsqueeze(0)
    wav = wav.unsqueeze(0).to(device) # Shape to [1, channels, samples]

    # 2. Build the message layer 
    secret_message = torch.randint(0, 2, (1, 16), dtype=torch.int32).to(device)
    
    # 3. Apply Waveform Modification on CPU
    with torch.no_grad():
        watermark = GENERATOR(wav, sample_rate=sr, message=secret_message)
        watermarked_wav = wav + watermark

    # 4. Clean formatting and deduce targeted output type
    watermarked_wav = watermarked_wav.squeeze(0).cpu()
    out_ext = os.path.splitext(output_path)[-1].lower().replace(".", "")
    
    # Save target out to requested wrapper extension dynamically
    torchaudio.save(output_path, watermarked_wav, sr, format=out_ext)
    print(f"🔒 Securely Protected & Saved: {output_path}\n")


def detect_universal_watermark(audio_path):
    """
    Scans any incoming audio format (wav/mp3/flac) on CPU to verify if 
    the active watermark footprint exists inside the waveform arrays.
    """
    if DETECTOR is None:
        raise RuntimeError("AudioSeal detector is not loaded. Cannot detect watermark.")

    if not os.path.exists(audio_path):
        print(f"❌ Error: Source file {audio_path} missing.")
        return

    # 1. Read and unpack audio arrays
    wav, sr = load_any_format(audio_path)
    if wav.dim() == 1:
        wav = wav.unsqueeze(0)
    wav = wav.unsqueeze(0).to(device)

    # 2. Evaluate array distributions using CPU Detector
    with torch.no_grad():
        result, message = DETECTOR(wav, sample_rate=sr)
        confidence = torch.sigmoid(result).item()

    print("\n" + "="*50)
    print("🔎 UNIVERSAL FORMAT WATERMARK SCAN RESULTS")
    print("="*50)
    print(f"File Checked:     {os.path.basename(audio_path)}")
    print(f"Format Tracked:   {os.path.splitext(audio_path)[-1].upper()}")
    print(f"Signature Valid:  {confidence > 0.5}")
    print(f"Confidence Level: {confidence:.2%}")
    print("="*50 + "\n")
    
    return confidence > 0.5


# Convenience wrappers matching existing module API

def embed_watermark(input_audio_path: str, output_audio_path: str, secret_message: None = None):
    return embed_universal_watermark(input_audio_path, output_audio_path)


def detect_watermark(audio_path: str):
    return detect_universal_watermark(audio_path)


# --- Execution Test Routine ---
if __name__ == "__main__":
    # Test names targeting different extensions
    source_mp3 = "input_test.mp3"
    secured_flac = "secured_output.flac"

    # Generate a mock mp3 for testing environment setup if one doesn't exist
    if not os.path.exists(source_mp3):
        print("Creating mock MP3 file for pipeline validation...")
        dummy_tensor = torch.randn(1, 16000 * 3) # 3 seconds
        torchaudio.save(source_mp3, dummy_tensor, 16000, format="mp3")

    # Run the cross-format embedding and verification process
    embed_universal_watermark(source_mp3, secured_flac)
    detect_universal_watermark(secured_flac)
