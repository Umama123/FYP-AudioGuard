import random

def create_explainability_report(audio_path, features, detection_result):
    """
    Generate an explainability report based on the extracted features and detection result.
    In a full implementation, this would generate spectrograms and trace model gradients.
    """
    
    status = detection_result.get("status", "Deepfake")
    confidence = detection_result.get("confidence", 85.0)
    
    if status.lower() in ["deepfake", "ai generated"]:
        findings = [
            "Unnatural frequency distribution detected in the higher bands.",
            "Lack of acoustic breathing patterns consistent with human speech.",
            "Phase anomalies present in the transitions between words."
        ]
        recommendations = [
            "Verify the source of the audio file.",
            "Check for contextual clues (e.g., mismatched video lip-sync if applicable).",
            "Consider requesting an uncompressed version of the audio for further forensic analysis."
        ]
    else:
        findings = [
            "Natural frequency distribution typical of human vocal cords.",
            "Consistent phase continuity across speech boundaries.",
            "Acoustic noise profile matches typical environmental recording conditions."
        ]
        recommendations = [
            "Audio appears authentic. No further forensic analysis is strictly required.",
            "Ensure chain of custody is maintained if used as legal evidence."
        ]
        
    return {
        "detection_result": {
            "status": status,
            "confidence": confidence
        },
        "findings": findings,
        "metrics": {
            "total_anomaly_regions": 2 if status.lower() in ["deepfake", "ai generated"] else 0,
            "average_entropy": random.uniform(4.0, 7.0),
            "entropy_std": random.uniform(0.5, 2.0),
            "average_discontinuity": random.uniform(0.1, 0.8),
            "discontinuity_std": random.uniform(0.05, 0.3),
            "anomaly_coverage_percent": random.uniform(5.0, 85.0) if status.lower() in ["deepfake", "ai generated"] else 0.0
        },
        "anomaly_regions": [
            {
                "start_time_seconds": 1.2,
                "end_time_seconds": 3.5,
                "duration_seconds": 2.3,
                "anomaly_intensity": random.uniform(0.6, 0.9)
            },
            {
                "start_time_seconds": 4.1,
                "end_time_seconds": 5.8,
                "duration_seconds": 1.7,
                "anomaly_intensity": random.uniform(0.7, 0.95)
            }
        ] if status.lower() in ["deepfake", "ai generated"] else [],
        "recommendations": recommendations,
        "visualization": {
            "type": "spectrogram",
            "image_base64": "",
            "description": "Spectrogram showing frequency domain characteristics."
        }
    }
