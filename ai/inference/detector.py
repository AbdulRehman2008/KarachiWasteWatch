"""
WasteDetector - Computer Vision Inference Module
Karachi WasteWatch AI
Uses yolo11n.pt for waste detection.
"""

from pathlib import Path
from typing import Dict, List, Any, Union, Optional
import cv2
import numpy as np
from PIL import Image, ImageOps
from ultralytics import YOLO


class WasteDetector:
    def __init__(self, model_path: Optional[Union[str, Path]] = None):
        """
        Initialize the Waste Detector.
        Resolves model in priority order:
        1. Explicit valid model_path parameter
        2. Environment variable YOLO_MODEL_PATH or MODEL_PATH
        3. 'best.pt' or 'waste_model.pt' in project root
        4. 'ai/model/best.pt'
        5. 'yolo11n.pt' baseline fallback
        """
        import os

        # Check candidate locations
        candidate_paths = []
        if model_path and model_path != "ensemble":
            candidate_paths.append(Path(model_path))

        env_path = os.getenv("YOLO_MODEL_PATH") or os.getenv("MODEL_PATH")
        if env_path:
            candidate_paths.append(Path(env_path))

        candidate_paths.extend([
            Path("best.pt"),
            Path("waste_model.pt"),
            Path("ai/model/best.pt"),
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
        print(f"Model loaded successfully with {len(self.model.names)} classes: {list(self.model.names.values())[:10]}")
 
    def get_model_info(self) -> Dict[str, Any]:
        """Return information about currently loaded model."""
        return {
            "model_path": str(self.model_path),
            "class_count": len(self.model.names),
            "classes": list(self.model.names.values()),
        }

    def detect(
        self,
        image_input: Union[str, Path, np.ndarray, Image.Image],
        confidence_threshold: float = 0.10,
        imgsz: int = 640,
        enable_adaptive_heap_scan: bool = True,
    ) -> Dict[str, Any]:
        """
        Run inference on the given image and return detections with annotated image.
        """
        # Load and normalise image to RGB numpy array
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

        # Run inference
        results = self.model.predict(
            source=img_np,
            conf=confidence_threshold,
            imgsz=imgsz,
            save=False,
            verbose=False,
        )
        boxes = results[0].boxes

        # Adaptive fallback: if nothing detected, try lower confidence
        if len(boxes) == 0 and enable_adaptive_heap_scan and confidence_threshold > 0.04:
            ad_res = self.model.predict(
                source=img_np, conf=0.035, imgsz=imgsz, save=False, verbose=False
            )
            if len(ad_res[0].boxes) > 0:
                boxes = ad_res[0].boxes

        # Build detection list
        final_detections: List[Dict[str, Any]] = []
        total_bbox_area = 0.0

        for box in boxes:
            cls_id = int(box.cls[0].item())
            cls_name = self.model.names.get(cls_id, f"class_{cls_id}").capitalize()
            conf = float(box.conf[0].item())
            xyxy = [round(c, 1) for c in box.xyxy[0].tolist()]

            bw = max(0.0, xyxy[2] - xyxy[0])
            bh = max(0.0, xyxy[3] - xyxy[1])
            box_area = bw * bh
            total_bbox_area += box_area

            final_detections.append({
                "class_id": len(final_detections),
                "class_name": cls_name,
                "confidence": round(conf, 4),
                "bbox": xyxy,
                "area_ratio": round(box_area / img_total_area, 4) if img_total_area > 0 else 0.0,
            })

        coverage_pct = round(
            min(100.0, (total_bbox_area / img_total_area) * 100.0), 2
        ) if img_total_area > 0 else 0.0

        # Draw bounding boxes on annotated image
        annotated_img = img_np.copy()
        for det in final_detections:
            x1, y1, x2, y2 = [int(c) for c in det["bbox"]]
            label = f"{det['class_name']} {det['confidence']:.0%}"
            color = (0, 215, 255)

            cv2.rectangle(annotated_img, (x1, y1), (x2, y2), color, 2)
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
            cv2.rectangle(annotated_img, (x1, max(0, y1 - 18)), (x1 + tw + 4, max(0, y1)), color, -1)
            cv2.putText(annotated_img, label, (x1 + 2, max(12, y1 - 4)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1)

        # Convert to BGR for compatibility with OpenCV conventions
        annotated_bgr = cv2.cvtColor(annotated_img, cv2.COLOR_RGB2BGR)

        # Determine dominant waste type from top detection
        waste_type = final_detections[0]["class_name"] if final_detections else "None"
        top_conf = final_detections[0]["confidence"] if final_detections else 0.0

        return {
            "total_detections": len(final_detections),
            "detections": final_detections,
            "waste_coverage_pct": coverage_pct,
            "waste_type": waste_type,
            "confidence": top_conf,
            "annotated_image": annotated_bgr,
            "image_dimensions": {"width": img_w, "height": img_h},
            "is_adaptive_detection": len(final_detections) > 0 and all(
                d["confidence"] < 0.20 for d in final_detections
            ),
            "scan_note": "yolo11n detection complete.",
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
        elif count >= 5 or coverage >= 25.0:
            return {
                "level": "High",
                "score": 0.85,
                "reason": f"High severity: {count} items detected covering {coverage}% of the scene.",
            }
        elif count >= 2 or coverage >= 8.0:
            return {
                "level": "Medium",
                "score": 0.55,
                "reason": f"Medium severity: {count} items detected covering {coverage}% of the scene.",
            }
        else:
            return {
                "level": "Low",
                "score": 0.25,
                "reason": f"Low severity: Minor litter ({count} item, {coverage}% coverage).",
            }
