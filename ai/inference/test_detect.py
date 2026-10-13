import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from ai.inference.detector import WasteDetector
import glob

print("=== Testing litter_best.pt (Litter & Waste Detector) ===")
d = WasteDetector("ai/model/litter_best.pt")

images = glob.glob("sample_images/*.jpg")
print(f"Found {len(images)} sample images\n")

for img in images:
    name = img.replace("\\", "/").split("/")[-1][:50]
    res = d.detect(img, confidence_threshold=0.15)
    sev = d.calculate_initial_severity(res)
    items = [x["class_name"] for x in res["detections"]]
    coverage = res["waste_coverage_pct"]
    count = res["total_detections"]
    print(f"  [{name}]")
    print(f"    Detections : {count}")
    print(f"    Items      : {items}")
    print(f"    Coverage   : {coverage}%")
    print(f"    Severity   : {sev['level']}")
    print()
