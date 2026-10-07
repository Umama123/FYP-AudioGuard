import json
import os

def generate_markdown():
    with open("db_records.json", "r") as f:
        data = json.load(f)
        
    artifact_dir = r"C:\Users\user\.gemini\antigravity-ide\brain\a11b00ca-b4c0-4bf1-b259-81746d7b4cb5"
    os.makedirs(artifact_dir, exist_ok=True)
    out_path = os.path.join(artifact_dir, "history_records.md")
    
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("# AudioGuard History Records\n\n")
        f.write("This artifact contains the exported history records from the `activity.db` database.\n\n")
        
        # Detections
        f.write("## Recent Detections\n")
        f.write("| ID | Filename | Status | Confidence | Mode | Created At |\n")
        f.write("|---|---|---|---|---|---|\n")
        for r in data.get("detections", [])[-15:]:  # Show last 15
            f.write(f"| {r['id']} | {r['filename']} | {r['status']} | {r['confidence']}% | {r['mode']} | {r['created_at'][:19]} |\n")
            
        # Enhancements
        f.write("\n## Recent Enhancements\n")
        f.write("| ID | Filename | Quality | Noise Reduction | Clarity Boost | Created At |\n")
        f.write("|---|---|---|---|---|---|\n")
        for r in data.get("enhancements", [])[-10:]:
            f.write(f"| {r['id']} | {r['filename']} | {r['quality']} | {r['noise_reduction']} | {r['clarity_boost']} | {r['created_at'][:19]} |\n")
            
        # Watermarks
        f.write("\n## Recent Watermarks\n")
        f.write("| ID | Filename | Secret ID | Created At |\n")
        f.write("|---|---|---|---|\n")
        for r in data.get("watermarks", [])[-10:]:
            f.write(f"| {r['id']} | {r['filename']} | {r['secret_id']} | {r['created_at'][:19]} |\n")
            
        # Reports
        f.write("\n## Recent Reports\n")
        f.write("| ID | Filename | Report Type | Created At |\n")
        f.write("|---|---|---|---|\n")
        for r in data.get("reports", [])[-10:]:
            f.write(f"| {r['id']} | {r['filename']} | {r['report_type']} | {r['created_at'][:19]} |\n")
            
    print("Generated history_records.md")

if __name__ == '__main__':
    generate_markdown()
