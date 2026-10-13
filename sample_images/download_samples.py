"""
Sample Images Downloader for Karachi WasteWatch AI
Downloads high quality public sample images of street waste for testing.
"""

import urllib.request
from pathlib import Path

SAMPLES = {
    "sample_street_waste_1.jpg": "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800&q=80",
    "sample_plastic_bottles_2.jpg": "https://images.unsplash.com/photo-1526951521990-620dc14c214b?w=800&q=80",
    "sample_cleaned_street_3.jpg": "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&q=80"
}

output_dir = Path("sample_images")
output_dir.mkdir(parents=True, exist_ok=True)

print("Downloading sample images for testing...")
headers = {'User-Agent': 'Mozilla/5.0'}

for filename, url in SAMPLES.items():
    filepath = output_dir / filename
    if not filepath.exists():
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as response, open(filepath, 'wb') as out_file:
                out_file.write(response.read())
            print(f"[+] Downloaded: {filename}")
        except Exception as e:
            print(f"[-] Could not download {filename}: {e}")
    else:
        print(f"[i] Already exists: {filename}")

print("Sample images ready in sample_images/")
