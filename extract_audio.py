import os
from moviepy import VideoFileClip  

# Folders ke naam
input_folder = "videos"
output_folder = "extracted_audio"

if not os.path.exists(output_folder):
    os.makedirs(output_folder)

for filename in os.listdir(input_folder):
    if filename.lower().endswith((".mp4", ".mkv", ".avi")):
        print(f"\n--- Processing: {filename} ---")
        try:
            video = VideoFileClip(os.path.join(input_folder, filename))
            
            base_name = os.path.splitext(filename)[0]
            
            # 1. WAV Format (pcm_s16le is standard for 16-bit)
            wav_path = os.path.join(output_folder, base_name + ".wav")
            print(f"Saving WAV...")
            video.audio.write_audiofile(wav_path, codec='pcm_s16le')
            
            # 2. MP3 Format
            mp3_path = os.path.join(output_folder, base_name + ".mp3")
            print(f"Saving MP3...")
            video.audio.write_audiofile(mp3_path) # MP3 ke liye default codec kaam kar jayega
            
            video.close()
            print(f" Done: {filename}")
            
        except Exception as e:
            print(f"❌ Error processing {filename}: {e}")

print("\nSuccess! Files 'extracted_audio' folder .")