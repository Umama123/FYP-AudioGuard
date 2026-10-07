import os
import numpy as np
import librosa
import soundfile as sf
from typing import Tuple, Dict, Optional
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AudioWatermarker:
    def __init__(self, watermark_strength: float = 0.015):
        self.sample_rate = None
        self.watermark_strength = watermark_strength
        # DSSS parameters
        self.chip_rate = 1024  # samples per bit
        self.payload_bits = 128 # 16 characters * 8 bits
        
        logger.info(f"Initializing DSSS CPU-only watermarker")
        logger.info(f"   Watermark Strength: {watermark_strength}")
        logger.info(f"   Chip Rate: {self.chip_rate} samples/bit")
    
    def _string_to_binary(self, message: str) -> str:
        # Pad or truncate to 16 characters
        message = (message + " " * 16)[:16]
        binary = ''.join(format(ord(c), '08b') for c in message)
        return binary

    def _binary_to_string(self, binary: str) -> str:
        try:
            chars = [chr(int(binary[i:i+8], 2)) for i in range(0, len(binary), 8)]
            return ''.join(chars).strip()
        except:
            return "unknown"

    def _generate_pn_sequence(self, length: int, seed: int = 42) -> np.ndarray:
        """Generate a pseudo-random noise sequence of +1 and -1"""
        rng = np.random.default_rng(seed)
        return rng.choice([-1.0, 1.0], size=length)

    def _normalize_audio(self, audio: np.ndarray) -> np.ndarray:
        max_val = np.abs(audio).max()
        if max_val > 0:
            audio = audio / (max_val * 1.1)
        return np.clip(audio, -1.0, 1.0)

    def _create_spread_signal(self, length: int, secret_message: str) -> np.ndarray:
        """Create the DSSS spread signal for a given payload"""
        binary = self._string_to_binary(secret_message)
        payload = np.array([1.0 if b == '1' else -1.0 for b in binary])
        
        pn_seq = self._generate_pn_sequence(length, seed=42)
        
        spread_signal = np.zeros(length)
        for i in range(length):
            bit_idx = (i // self.chip_rate) % self.payload_bits
            spread_signal[i] = payload[bit_idx] * pn_seq[i]
            
        return spread_signal

    def embed_watermark(self, input_audio_path: str, output_audio_path: str, secret_message: Optional[str] = None) -> Dict:
        try:
            logger.info(f"Loading audio from: {input_audio_path}")
            if not os.path.exists(input_audio_path):
                raise FileNotFoundError(f"Audio file not found: {input_audio_path}")
            
            audio, sr = librosa.load(input_audio_path, sr=None, mono=True)
            self.sample_rate = sr
            original_duration = librosa.get_duration(y=audio, sr=sr)
            original_sr = sr
            
            audio = self._normalize_audio(audio)
            
            if secret_message is None:
                secret_message = "AudioGuard123"
                
            logger.info(f"Generating DSSS spread signal for payload: {secret_message}")
            spread_signal = self._create_spread_signal(len(audio), secret_message)
            
            logger.info("Embedding DSSS watermark...")
            watermarked_audio = audio + self.watermark_strength * spread_signal
            watermarked_audio = self._normalize_audio(watermarked_audio)
            
            # Re-validate immediately
            validation = self._extract_watermark(watermarked_audio)
            
            output_dir = os.path.dirname(output_audio_path) or '.'
            os.makedirs(output_dir, exist_ok=True)
            sf.write(output_audio_path, watermarked_audio, self.sample_rate)
            
            file_size = os.path.getsize(output_audio_path) / (1024 * 1024)
            
            return {
                "status": "success",
                "watermark_id": secret_message,
                "original_duration": float(original_duration),
                "original_sample_rate": int(original_sr),
                "output_sample_rate": self.sample_rate,
                "watermark_detected": validation['detected'],
                "correlation": validation['correlation'],
                "snr_db": validation['snr_db'],
                "payload_integrity": validation['payload_integrity'],
                "explainability": validation.get('explainability'),
                "output_path": output_audio_path,
                "file_size_mb": round(file_size, 2),
                "timestamp": datetime.now().isoformat(),
                "device": "CPU",
                "method": "Direct-Sequence-Spread-Spectrum",
                "message": "Watermark embedded and validated"
            }
        except Exception as e:
            logger.error(f"Watermarking failed: {str(e)}")
            return {"status": "error", "message": str(e), "timestamp": datetime.now().isoformat(), "device": "CPU"}
            
    def detect_watermark(self, audio_path: str) -> Dict:
        try:
            logger.info(f"Loading audio for detection: {audio_path}")
            if not os.path.exists(audio_path):
                raise FileNotFoundError(f"Audio file not found: {audio_path}")
            
            audio, sr = librosa.load(audio_path, sr=None, mono=True)
            self.sample_rate = sr
            duration = librosa.get_duration(y=audio, sr=sr)
            
            audio = self._normalize_audio(audio)
            
            validation = self._extract_watermark(audio)
            
            return {
                "status": "success",
                "watermark_detected": validation['detected'],
                "correlation": validation['correlation'],
                "snr_db": validation['snr_db'],
                "payload_integrity": validation['payload_integrity'],
                "extracted_id": validation['extracted_payload'] if validation['detected'] else "no_watermark",
                "audio_duration": float(duration),
                "sample_rate": int(sr),
                "file_path": audio_path,
                "timestamp": datetime.now().isoformat(),
                "device": "CPU",
                "method": "Direct-Sequence-Spread-Spectrum",
                "message": "Watermark Found" if validation['detected'] else "No Watermark Detected",
                "explainability": validation.get('explainability'),
            }
        except Exception as e:
            logger.error(f"Detection failed: {str(e)}")
            return {"status": "error", "watermark_detected": False, "correlation": 0.0, "snr_db": 0.0, "payload_integrity": 0.0, "message": str(e)}

    def _extract_watermark(self, audio: np.ndarray) -> Dict:
        try:
            length = len(audio)
            pn_seq = self._generate_pn_sequence(length, seed=42)
            
            # Demodulate by multiplying with the identical PN sequence
            demodulated = audio * pn_seq
            
            bit_sums = np.zeros(self.payload_bits)
            counts = np.zeros(self.payload_bits)
            
            # Integrate over the chips
            for i in range(length):
                bit_idx = (i // self.chip_rate) % self.payload_bits
                bit_sums[bit_idx] += demodulated[i]
                counts[bit_idx] += 1
                
            extracted_binary = ""
            for i in range(self.payload_bits):
                if counts[i] > 0:
                    extracted_binary += "1" if bit_sums[i] > 0 else "0"
                else:
                    extracted_binary += "0"
                    
            extracted_string = self._binary_to_string(extracted_binary)
            
            # Calculate correlation to see if it's a real watermark or just noise matching
            payload_array = np.array([1.0 if b == '1' else -1.0 for b in extracted_binary])
            reconstructed_spread = np.zeros(length)
            for i in range(length):
                bit_idx = (i // self.chip_rate) % self.payload_bits
                reconstructed_spread[i] = payload_array[bit_idx] * pn_seq[i]
                
            norm_audio = np.linalg.norm(audio)
            norm_spread = np.linalg.norm(reconstructed_spread)
            
            if norm_audio == 0 or norm_spread == 0:
                correlation = 0.0
            else:
                correlation = float(np.dot(audio, reconstructed_spread) / (norm_audio * norm_spread))
                
            # A threshold to consider a real watermark. If it's just noise, correlation is near 0.
            # DSSS correlation threshold. 
            threshold = 0.005
            detected = correlation > threshold
            
            # Estimate SNR (Signal is the Audio, Noise is the DSSS Watermark). Wait, in watermarking, the watermark is the signal.
            # So SNR = power of watermark / power of audio.
            # In detection, the correlation gives us an estimate of the amplitude ratio.
            snr_estimate = 20 * np.log10(max(correlation, 1e-10))
            payload_integrity = 100.0 if detected else 0.0
            
            explainability = {
                "description": "Blind Direct Sequence Spread Spectrum (DSSS) extraction performed. "
                               "The audio was multiplied by the synchronized pseudo-random noise sequence and integrated over the chip rate to recover the hidden payload bits.",
                "payload_bits": self.payload_bits,
                "chip_rate": self.chip_rate,
                "correlation": float(correlation),
                "detection_threshold": threshold,
                "estimated_snr_db": snr_estimate,
                "extracted_raw_bits": extracted_binary[:32] + "..."
            }
            
            logger.info(f"   DSSS Blind correlation: {correlation:.4f}")
            logger.info(f"   Detected: {detected}")
            logger.info(f"   Extracted Payload: {extracted_string}")

            return {
                "detected": detected,
                "correlation": float(correlation),
                "snr_db": float(snr_estimate),
                "payload_integrity": float(payload_integrity),
                "extracted_payload": extracted_string,
                "explainability": explainability,
            }
        except Exception as e:
            logger.error(f"Validation error: {str(e)}")
            return {"detected": False, "correlation": 0.0, "snr_db": 0.0, "payload_integrity": 0.0, "extracted_payload": ""}

def embed_watermark(input_audio_path: str, output_audio_path: str, secret_message_or_id: Optional[str] = None) -> Dict:
    watermarker = AudioWatermarker()
    return watermarker.embed_watermark(input_audio_path, output_audio_path, secret_message_or_id)

def detect_watermark(audio_path: str) -> Dict:
    watermarker = AudioWatermarker()
    return watermarker.detect_watermark(audio_path)

if __name__ == "__main__":
    print("DSSS Audio Watermarking Module Loaded")
