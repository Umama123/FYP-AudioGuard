import sys
import os

# Add the models directory to the path so we can import aasist
sys.path.append(os.path.join(os.path.dirname(__file__), "models"))

from aasist import AASISTDetector

def main():
    print("Testing AASISTDetector ONNX model inference...")
    try:
        detector = AASISTDetector()
        print("Model loaded successfully.")
    except Exception as e:
        print(f"Failed to load model: {e}")
        return

    test_audio = "test.wav"
    if not os.path.exists(test_audio):
        print(f"Audio file {test_audio} not found. Please provide a valid audio path.")
        return

    print(f"Running inference on {test_audio}...")
    try:
        is_deepfake, confidence, score = detector.detect(test_audio)
        print(f"Output:")
        print(f"  Is Deepfake : {is_deepfake}")
        print(f"  Confidence  : {confidence:.4f}")
        print(f"  Raw Score   : {score:.4f}")
        print("Success: Model successfully output results after reading the input audio.")
    except Exception as e:
        print(f"Failed during inference: {e}")

if __name__ == "__main__":
    main()
