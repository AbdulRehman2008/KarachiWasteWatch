"""
YOLO Training Script for Karachi WasteWatch AI (Phase 2)
Trains YOLO11 on the waste detection dataset.
"""

import argparse
from pathlib import Path
from ultralytics import YOLO


def train_waste_model(
    data_yaml: str = "ai/datasets/karachi_waste/data.yaml",
    model_name: str = "yolo11n.pt",
    epochs: int = 25,
    imgsz: int = 640,
    batch_size: int = 8,
    project: str = "runs/detect",
    name: str = "karachi_waste_exp",
):
    """
    Train YOLO on the Karachi waste dataset.
    """
    yaml_path = Path(data_yaml)
    if not yaml_path.exists():
        print(f"[!] Error: Dataset configuration file not found at: {yaml_path.resolve()}")
        print("Please ensure your dataset is placed in ai/datasets/karachi_waste/ with data.yaml.")
        return None

    print(f"[*] Starting training using base model: {model_name}")
    print(f"[*] Dataset: {yaml_path.resolve()}")
    print(f"[*] Epochs: {epochs}, Batch size: {batch_size}, Image size: {imgsz}")

    # Load base YOLO model
    model = YOLO(model_name)

    # Train the model
    results = model.train(
        data=str(yaml_path.resolve()),
        epochs=epochs,
        imgsz=imgsz,
        batch=batch_size,
        project=project,
        name=name,
        plots=True,
        save=True,
        exist_ok=True,
    )

    print("\n[+] Training complete!")
    best_weights = Path(project) / name / "weights" / "best.pt"
    if best_weights.exists():
        target_path = Path("ai/model/best.pt")
        target_path.parent.mkdir(parents=True, exist_ok=True)
        import shutil
        shutil.copy2(best_weights, target_path)
        print(f"[+] Updated active model weights at: {target_path.resolve()}")
    print(f"[+] Best weights saved at: {best_weights}")
    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train YOLO11 on Karachi Waste Dataset")
    parser.add_argument("--data", type=str, default="ai/datasets/karachi_waste/data.yaml", help="Path to data.yaml")
    parser.add_argument("--model", type=str, default="yolo11n.pt", help="Pretrained YOLO base model")
    parser.add_argument("--epochs", type=int, default=15, help="Number of training epochs")
    parser.add_argument("--batch", type=int, default=8, help="Batch size")
    parser.add_argument("--imgsz", type=int, default=640, help="Image resolution")

    args = parser.parse_args()
    train_waste_model(
        data_yaml=args.data,
        model_name=args.model,
        epochs=args.epochs,
        batch_size=args.batch,
        imgsz=args.imgsz,
    )
