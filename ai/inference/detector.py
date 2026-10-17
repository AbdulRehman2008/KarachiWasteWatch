"""
WasteDetector - Computer Vision Inference Module
Karachi WasteWatch AI
Professional Civic Street Garbage & Litter Detection Engine.
"""

from pathlib import Path
from typing import Dict, List, Any, Union, Optional, Tuple
import cv2
import numpy as np
from PIL import Image, ImageOps
from ultralytics import YOLO


# Categories strictly blacklisted from being classified as waste
NON_WASTE_CLASSES = {
    "person", "people", "man", "woman", "child", "pedestrian", "human",
    "car", "motorcycle", "bus", "truck", "train", "bicycle", "boat", "airplane", "vehicle",
    "traffic light", "fire hydrant", "stop sign", "parking meter", "bench",
    "bird", "cat", "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe",
    "backpack", "umbrella", "handbag", "tie", "suitcase",
    "frisbee", "skis", "snowboard", "sports ball", "kite", "baseball bat", "baseball glove",
    "skateboard", "surfboard", "tennis racket",
    "chair", "couch", "potted plant", "bed", "dining table", "toilet",
    "tv", "laptop", "mouse", "remote", "keyboard", "cell phone",
    "microwave", "oven", "toaster", "sink", "refrigerator",
    "book", "clock", "vase", "scissors", "teddy bear", "hair drier", "toothbrush",
}

# Professional names for genuine waste categories
WASTE_NAME_MAP = {
    "trash": "Street Garbage / Mixed Refuse",
    "bag": "Trash Bag / Plastic Bag",
    "plastic": "Plastic Waste / Packaging",
    "cardboard": "Cardboard Packaging",
    "paper": "Paper Litter / Wrappers",
    "metal": "Scrap Metal / Cans",
    "glass": "Glass Waste / Bottles",
    "furniture": "Discarded Furniture / Debris",
    "yard": "Organic / Green Waste",
    # Pretrained COCO litter items
    "bottle": "Plastic Bottle / Container",
    "cup": "Disposable Cup / Packaging",
    "can": "Metal Beverage Can",
    "bowl": "Discarded Food Container",
}


def compute_iou(box1: List[float], box2: List[float]) -> float:
    """Calculate Intersection over Union (IoU) between two bounding boxes [x1, y1, x2, y2]."""
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])

    inter_w = max(0.0, x2 - x1)
    inter_h = max(0.0, y2 - y1)
    inter_area = inter_w * inter_h
    if inter_area <= 0:
        return 0.0

    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union = area1 + area2 - inter_area
    return inter_area / union if union > 0 else 0.0


class WasteDetector:
    def __init__(self, model_path: Optional[Union[str, Path]] = None):
        """
        Initialize the Waste Detector.
        Resolves model in priority order:
        1. Explicit valid model_path parameter
        2. Environment variable YOLO_MODEL_PATH or MODEL_PATH
        3. 'ai/model/best.pt'
        4. 'best.pt'
        5. 'runs/detect/runs/detect/karachi_waste_exp/weights/best.pt'
        6. 'waste_model.pt'
        7. 'yolo11n.pt' baseline fallback
        """
        import os

        candidate_paths = []
        if model_path and model_path != "ensemble":
            candidate_paths.append(Path(model_path))

        env_path = os.getenv("YOLO_MODEL_PATH") or os.getenv("MODEL_PATH")
        if env_path:
            candidate_paths.append(Path(env_path))

        candidate_paths.extend([
            Path("ai/model/best.pt"),
            Path("best.pt"),
            Path("runs/detect/runs/detect/karachi_waste_exp/weights/best.pt"),
            Path("waste_model.pt"),
            Path("yolo11n.pt"),
        ])

        resolved_path = None
        for p in candidate_paths:
            if p.is_file():
                resolved_path = p
                break

        if not resolved_path:
            resolved_path = Path("yolo11n.pt")

        print(f"Loading YOLO model from: {resolved_path.resolve()}...")
        self.model_path = resolved_path
        self.model = YOLO(str(resolved_path))
        self.models = [self.model]
        print(f"Model loaded successfully with {len(self.model.names)} classes.")

    def get_model_info(self) -> Dict[str, Any]:
        """Return information about currently loaded model."""
        return {
            "model_path": str(self.model_path),
            "class_count": len(self.model.names),
            "classes": list(self.model.names.values()),
        }

    def _detect_street_garbage_heaps(
        self,
        img_np: np.ndarray,
        excluded_boxes: List[List[int]],
    ) -> List[Dict[str, Any]]:
        """
        Computer Vision Heap Analyzer for uncollected street garbage heaps and litter patches.
        Analyzes high-frequency texture entropy, multi-color chaos, and localized disorder
        while strictly masking out humans, vehicles, and clean asphalt/sky.
        """
        img_h, img_w = img_np.shape[:2]
        img_total_area = float(img_h * img_w)
        if img_total_area == 0:
            return []

        # 1. Texture standard deviation via local filter
        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
        kernel_size = 15
        kernel = np.ones((kernel_size, kernel_size), np.float32) / (kernel_size * kernel_size)
        mean = cv2.filter2D(gray.astype(np.float32), -1, kernel)
        sq_mean = cv2.filter2D((gray.astype(np.float32)) ** 2, -1, kernel)
        var = np.maximum(0.0, sq_mean - mean ** 2)
        std = np.sqrt(var)

        # 2. Color saturation (garbage wrappers/bags are vivid compared to dull pavement)
        hsv = cv2.cvtColor(img_np, cv2.COLOR_RGB2HSV)
        sat = hsv[:, :, 1]

        # 3. Candidate waste pixel probability
        # Street garbage typically exhibits localized texture variance and scattered colors
        waste_prob = (std > 20.0) & (sat > 18.0)

        # 4. Strict exclusion: mask out detected humans, vehicles, etc.
        for (bx1, by1, bx2, by2) in excluded_boxes:
            px1, py1 = max(0, bx1 - 6), max(0, by1 - 6)
            px2, py2 = min(img_w, bx2 + 6), min(img_h, by2 + 6)
            waste_prob[py1:py2, px1:px2] = False

        # 5. Mask out upper 20% of image (sky, roofs, high walls)
        waste_prob[:int(img_h * 0.20), :] = False

        waste_mask = (waste_prob.astype(np.uint8)) * 255

        # 6. Morphological operations to group clusters
        kernel_close = cv2.getStructuringElement(cv2.MORPH_RECT, (31, 31))
        cleaned = cv2.morphologyEx(waste_mask, cv2.MORPH_CLOSE, kernel_close)
        kernel_open = cv2.getStructuringElement(cv2.MORPH_RECT, (13, 13))
        cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_OPEN, kernel_open)

        contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        heap_detections: List[Dict[str, Any]] = []

        min_area_thresh = img_total_area * 0.035  # At least 3.5% of the frame
        for cnt in contours:
            cnt_area = cv2.contourArea(cnt)
            if cnt_area >= min_area_thresh:
                x, y, bw, bh = cv2.boundingRect(cnt)
                # Verify that aspect ratio and position are consistent with a ground waste pile
                aspect_ratio = float(bw) / float(bh) if bh > 0 else 0.0
                if 0.25 <= aspect_ratio <= 5.0 and y + bh > int(img_h * 0.35):
                    # Compute confidence based on internal texture density
                    roi_std = std[y:y+bh, x:x+bw]
                    density = float(np.mean(roi_std > 22.0))
                    confidence = round(min(0.95, max(0.65, 0.60 + density * 0.40)), 4)
                    box_area = float(bw * bh)
                    area_ratio = round(box_area / img_total_area, 4)

                    heap_detections.append({
                        "class_name": "Street Garbage Heap / Mixed Refuse",
                        "confidence": confidence,
                        "bbox": [float(x), float(y), float(x + bw), float(y + bh)],
                        "area_ratio": area_ratio,
                    })

        return heap_detections

    def detect(
        self,
        image_input: Union[str, Path, np.ndarray, Image.Image],
        confidence_threshold: float = 0.20,
        imgsz: int = 640,
        enable_adaptive_heap_scan: bool = True,
    ) -> Dict[str, Any]:
        """
        Run professional civic waste detection on the given image.
        Strictly filters out humans, vehicles, and non-waste objects from being reported as garbage.
        Combines neural object detection with street waste heap segmentation.
        """
        # Load and normalize image to RGB numpy array
        if isinstance(image_input, Image.Image):
            pil_img = ImageOps.exif_transpose(image_input).convert("RGB")
            img_np = np.array(pil_img)
        elif isinstance(image_input, (str, Path)):
            pil_img = Image.open(str(image_input))
            pil_img = ImageOps.exif_transpose(pil_img).convert("RGB")
            img_np = np.array(pil_img)
        else:
            img_np = image_input

        img_h, img_w = img_np.shape[:2]
        img_total_area = float(img_h * img_w)

        # 1. Run inference with base/trained YOLO model
        results = self.model.predict(
            source=img_np,
            conf=confidence_threshold,
            imgsz=imgsz,
            save=False,
            verbose=False,
        )
        boxes = results[0].boxes

        excluded_regions: List[List[int]] = []
        raw_waste_detections: List[Dict[str, Any]] = []

        # 2. Inspect YOLO boxes and strictly separate waste vs non-waste objects
        for box in boxes:
            cls_id = int(box.cls[0].item())
            raw_name = self.model.names.get(cls_id, f"class_{cls_id}").lower().strip()
            conf = float(box.conf[0].item())
            xyxy = [round(c, 1) for c in box.xyxy[0].tolist()]

            # STRICT CHECK: If it is a person, vehicle, animal, or household non-waste object, EXCLUDE!
            if raw_name in NON_WASTE_CLASSES:
                excluded_regions.append([int(c) for c in xyxy])
                continue

            # Check if it matches a known waste class
            clean_name = WASTE_NAME_MAP.get(raw_name)
            if not clean_name:
                # If custom model class is one of the waste classes
                if raw_name in ["bag", "cardboard", "furniture", "glass", "metal", "paper", "plastic", "trash", "yard"]:
                    clean_name = WASTE_NAME_MAP.get(raw_name, raw_name.capitalize())
                elif "waste" in raw_name or "garbage" in raw_name or "litter" in raw_name:
                    clean_name = raw_name.title()
                else:
                    # Non-waste class from general vocabulary -> skip
                    continue

            bw = max(0.0, xyxy[2] - xyxy[0])
            bh = max(0.0, xyxy[3] - xyxy[1])
            box_area = bw * bh

            raw_waste_detections.append({
                "class_name": clean_name,
                "confidence": round(conf, 4),
                "bbox": xyxy,
                "area_ratio": round(box_area / img_total_area, 4) if img_total_area > 0 else 0.0,
            })

        # 3. Detect Street Garbage Heaps / Refuse Piles via Computer Vision Heap Analyzer
        heap_detections: List[Dict[str, Any]] = []
        if enable_adaptive_heap_scan:
            heap_detections = self._detect_street_garbage_heaps(img_np, excluded_regions)

        # 4. Merge detections with Non-Maximum Suppression / IoU deduplication
        all_candidates = sorted(
            raw_waste_detections + heap_detections,
            key=lambda d: d["confidence"],
            reverse=True,
        )

        final_detections: List[Dict[str, Any]] = []
        for cand in all_candidates:
            # Check overlap with already accepted detections
            overlap = False
            for accepted in final_detections:
                if compute_iou(cand["bbox"], accepted["bbox"]) > 0.45:
                    overlap = True
                    break
            if not overlap:
                cand["class_id"] = len(final_detections)
                final_detections.append(cand)

        # 5. Compute total waste coverage on the image
        total_bbox_area = sum(
            max(0.0, d["bbox"][2] - d["bbox"][0]) * max(0.0, d["bbox"][3] - d["bbox"][1])
            for d in final_detections
        )
        coverage_pct = round(
            min(100.0, (total_bbox_area / img_total_area) * 100.0), 2
        ) if img_total_area > 0 else 0.0

        # Strict civic condition: Has waste only if verified waste items/heaps exist
        has_waste = (len(final_detections) > 0 and coverage_pct >= 0.5)

        # 6. Draw clean, professional bounding boxes ONLY on waste items
        annotated_img = img_np.copy()
        for det in final_detections:
            x1, y1, x2, y2 = [int(c) for c in det["bbox"]]
            label = f"{det['class_name']} ({det['confidence']:.0%})"
            color = (0, 215, 255)  # Bright cyan

            # Draw outer rectangle and glow
            cv2.rectangle(annotated_img, (x1, y1), (x2, y2), color, 2)
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
            cv2.rectangle(annotated_img, (x1, max(0, y1 - 20)), (x1 + tw + 6, max(0, y1)), color, -1)
            cv2.putText(annotated_img, label, (x1 + 3, max(14, y1 - 5)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1)

        annotated_bgr = cv2.cvtColor(annotated_img, cv2.COLOR_RGB2BGR)

        waste_type = final_detections[0]["class_name"] if final_detections else "None"
        top_conf = final_detections[0]["confidence"] if final_detections else 0.0

        if not has_waste:
            if excluded_regions:
                scan_note = f"No street garbage detected. {len(excluded_regions)} non-waste background object(s) (e.g. people/vehicles) excluded."
            else:
                scan_note = "No street garbage or litter detected in this image."
        else:
            scan_note = f"Verified street garbage: {len(final_detections)} waste item(s)/pile(s) detected with {coverage_pct}% scene coverage."

        return {
            "total_detections": len(final_detections),
            "has_waste": has_waste,
            "detections": final_detections,
            "waste_coverage_pct": coverage_pct,
            "waste_type": waste_type,
            "confidence": top_conf,
            "annotated_image": annotated_bgr,
            "image_dimensions": {"width": img_w, "height": img_h},
            "is_adaptive_detection": any("Heap" in d.get("class_name", "") for d in final_detections),
            "scan_note": scan_note,
        }

    def calculate_initial_severity(self, detection_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Rule-based severity calculator based on detection count and coverage.
        """
        count = detection_result["total_detections"]
        coverage = detection_result["waste_coverage_pct"]

        if count == 0:
            return {
                "level": "Clean / None",
                "score": 0.0,
                "reason": "No waste detected in the image.",
            }
        elif count >= 4 or coverage >= 25.0:
            return {
                "level": "High",
                "score": 0.85,
                "reason": f"High severity: {count} waste items/heaps covering {coverage}% of the scene.",
            }
        elif count >= 2 or coverage >= 8.0:
            return {
                "level": "Medium",
                "score": 0.55,
                "reason": f"Medium severity: {count} waste items detected covering {coverage}% of the scene.",
            }
        else:
            return {
                "level": "Low",
                "score": 0.25,
                "reason": f"Low severity: Minor litter ({count} item, {coverage}% coverage).",
            }
