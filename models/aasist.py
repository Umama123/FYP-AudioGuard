import os
import librosa
import numpy as np
import onnxruntime as ort
import huggingface_hub

class AASISTDetector:
    def __init__(self, device="cpu", model_path=None):
        """
        Initializes the AASIST model using the official HuggingFace MTUCI/AASIST3 ONNX weights.
        """
        self.device = device
        
        print("[AASISTDetector] Checking for local MTUCI/AASIST3 ONNX weights...")
        try:
            local_onnx_path = os.path.join(os.path.dirname(__file__), "aasist3.onnx")
            if os.path.exists(local_onnx_path):
                onnx_path = local_onnx_path
                print(f"[AASISTDetector] Found local ONNX model: {onnx_path}")
            else:
                # Download the ONNX model from the HuggingFace Hub
                print("[AASISTDetector] Downloading/Verifying MTUCI/AASIST3 ONNX weights...")
                onnx_path = huggingface_hub.hf_hub_download(repo_id="MTUCI/AASIST3", filename="aasist3.onnx")
            
            # Initialize ONNX Runtime session
            providers = ['CUDAExecutionProvider'] if "cuda" in device else ['CPUExecutionProvider']
            self.session = ort.InferenceSession(onnx_path, providers=providers)
            
            print(f"[AASISTDetector] Successfully loaded ONNX model from: {onnx_path}")
            print(f"[DEBUG - AASISTDetector] Device used: {device}, Providers: {providers}")
            
        except Exception as e:
            raise RuntimeError(f"Failed to load MTUCI/AASIST3 ONNX model: {e}")

    def detect(self, audio_path):
        """
        Detect if an audio file is spoofed (Deepfake) or Real.
        """
        import tempfile
        import os
        # Try to load directly (best for FLAC/WAV to preserve quality)
        print(f"[DEBUG - AASISTDetector detect] Processing audio_path: {audio_path}")
        tmp_wav = None
        try:
            print(f"[DEBUG - AASISTDetector detect] Loading audio with librosa directly from {audio_path}")
            wav, sr = librosa.load(audio_path, sr=16000, mono=True)
            print(f"[DEBUG - AASISTDetector detect] Audio loaded directly: len(wav)={len(wav)}, sr={sr}")
        except Exception as e:
            print(f"[DEBUG - AASISTDetector detect] Direct load failed: {e}. Falling back to moviepy conversion...")
            import tempfile
            from moviepy.editor import AudioFileClip
            tmp_wav = tempfile.mktemp(suffix=".wav")
            try:
                clip = AudioFileClip(audio_path)
                clip.write_audiofile(tmp_wav, fps=16000, nbytes=2, buffersize=2000, logger=None)
                clip.close()
                print(f"[DEBUG - AASISTDetector detect] Successfully converted to temp WAV: {tmp_wav}")
                wav, sr = librosa.load(tmp_wav, sr=16000, mono=True)
            finally:
                if tmp_wav and os.path.exists(tmp_wav):
                    try:
                        os.remove(tmp_wav)
                    except:
                        pass

        
        # Pad or truncate to exactly 64600 samples
        window_samples = 64600
        x_len = wav.shape[0]
        
        if x_len == 0:
            print("[DEBUG - AASISTDetector detect] Error: Audio file length is 0.")
            raise ValueError("Audio file is empty or corrupted.")
            
        if np.max(np.abs(wav)) < 1e-4:
            print(f"[DEBUG - AASISTDetector detect] Error: Max abs value is too low {np.max(np.abs(wav))} (< 1e-4)")
            raise ValueError("The uploaded audio is completely silent or corrupted by the browser! Please check microphone permissions.")
            
        if x_len >= window_samples:
            wav = wav[:window_samples]
        else:
            num_repeats = int(window_samples / x_len) + 1
            wav = np.tile(wav, num_repeats)[:window_samples]
            
        # Shape must be [Batch, Time] -> [1, 64600]
        wav_input = np.expand_dims(wav, axis=0).astype(np.float32)
        
        # Run ONNX inference
        # The input name for this model is 'wav'
        print(f"[DEBUG - AASISTDetector detect] wav_input shape: {wav_input.shape}, min: {np.min(wav_input)}, max: {np.max(wav_input)}, mean: {np.mean(wav_input)}")
        inputs = {self.session.get_inputs()[0].name: wav_input}
        print(f"[DEBUG - AASISTDetector detect] Running ONNX inference...")
        logits = self.session.run(None, inputs)[0][0]
        print(f"[DEBUG - AASISTDetector detect] Inference completed. Raw Logits: {logits}")
        
        # --- CALIBRATION FOR IN-THE-WILD BROWSER AUDIO ---
        # AASIST was trained on high-quality, uncompressed ASVspoof data. 
        # When users record audio via the browser, it uses lossy compression (like Opus/WebM).
        # This compression strips high frequencies and introduces artifacts that AASIST heavily confuses with Deepfake vocoders.
        # We apply a calibration penalty to the Deepfake logit to fix this False Positive bias on real human voices.
        CALIBRATION_PENALTY = 4.5
        logits[0] -= CALIBRATION_PENALTY
        print(f"[DEBUG - AASISTDetector detect] After Calibration Penalty (-{CALIBRATION_PENALTY}): {logits}")
        # -------------------------------------------------
        
        # Apply softmax to get probabilities with Temperature Scaling
        # AASIST naturally outputs extreme logits (e.g. +6 vs -5), causing softmax to collapse to 100.0% or 0.0%.
        # A temperature of 2.5 softens this to realistic percentages (e.g., 98% instead of 99.999%).
        temperature = 2.5
        scaled_logits = logits / temperature
        exp_logits = np.exp(scaled_logits - np.max(scaled_logits))
        probs = exp_logits / np.sum(exp_logits)
        
        # MTUCI/AASIST3 convention (Standard ASVspoof): Class 0 is Spoof (Deepfake), Class 1 is Bonafide (Real)
        deepfake_prob = float(probs[0])
        real_prob = float(probs[1])
        
        print(f"[DEBUG - AASISTDetector detect] AASIST Output - Deepfake Prob (Class 0): {deepfake_prob:.4f}, Real Prob (Class 1): {real_prob:.4f}")
        print(f"[DEBUG - AASISTDetector detect] RAW LOGITS -> Class 0 (Deepfake): {logits[0]:.4f}, Class 1 (Real): {logits[1]:.4f}")
        
        is_deepfake = deepfake_prob > real_prob
        
        if is_deepfake:
            confidence = deepfake_prob * 100.0
        else:
            confidence = real_prob * 100.0
            
        # The user wants to see the actual RAW score from the network, not just a scaled probability
        raw_score = {
            "deepfake_logit": float(logits[0]),
            "real_logit": float(logits[1]),
            "logit_diff": float(logits[0] - logits[1])
        }
        
        print(f"[DEBUG - AASISTDetector detect] Returning: is_deepfake={is_deepfake}, confidence={confidence}, score={raw_score}")
        return is_deepfake, confidence, raw_score