"""
Evaluation and Metrics Script for Karachi WasteWatch AI (Phase 2)
Evaluates trained YOLO model and computes Precision, Recall, mAP50, mAP50-95, and F1.
"""

import argparse
from pathlib import Path
from ultralytics import YOLO


def evaluate_model(
    model_path: str = "runs/detect/karachi_waste_exp/weights/best.pt",
    data_yaml: str = "ai/datasets/karachi_waste/data.yaml",
    split: str = "val",
    imgsz: int = 640,
):
    """
    Evaluate the model on a dataset split and print a detailed metrics summary.
    """
    m_path = Path(model_path)
    if not m_path.exists():
        print(f"[!] Model file '{model_path}' not found.")
        print("Falling back to pre-trained base model 'yolo11n.pt' for verification...")
        model_path = "yolo11n.pt"

    yaml_path = Path(data_yaml)
    if not yaml_path.exists():
        print(f"[!] Dataset yaml '{data_yaml}' not found.")
        return

    print(f"[*] Loading model for evaluation: {model_path}")
    print(f"[*] Dataset: {data_yaml} (split: {split})")

    model = YOLO(model_path)

    # Run validation
    metrics = model.val(
        data=str(yaml_path.resolve()),
        split=split,
        imgsz=imgsz,
        plots=True,
    )

    precision = metrics.box.mp
    recall = metrics.box.mr
    map50 = metrics.box.map50
    map50_95 = metrics.box.map

    f1 = 2 * (precision * recall) / (precision + recall + 1e-8)

    print("\n" + "=" * 55)
    print("      KARACHI WASTEWATCH AI - EVALUATION METRICS     ")
    print("=" * 55)
    print(f" Precision (P)    : {precision * 100:.2f}%")
    print(f" Recall (R)       : {recall * 100:.2f}%")
    print(f" F1-Score         : {f1 * 100:.2f}%")
    print(f" mAP@50           : {map50 * 100:.2f}%")
    print(f" mAP@50-95        : {map50_95 * 100:.2f}%")
    print("=" * 55)
    print("Detailed plots and confusion matrix saved in: runs/detect/val/")

    return {
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "map50": map50,
        "map50_95": map50_95,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate YOLO on Karachi Waste Dataset")
    parser.add_argument("--model", type=str, default="runs/detect/karachi_waste_exp/weights/best.pt", help="Path to trained model")
    parser.add_argument("--data", type=str, default="ai/datasets/karachi_waste/data.yaml", help="Path to data.yaml")
    parser.add_argument("--split", type=str, default="val", choices=["val", "test"], help="Dataset split to evaluate")

    args = parser.parse_args()
    evaluate_model(model_path=args.model, data_yaml=args.data, split=args.split)
