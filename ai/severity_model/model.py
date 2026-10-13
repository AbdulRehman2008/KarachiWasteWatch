"""
Machine Learning Severity Classifier (Phase 8, Stage 5)
Uses tabular features from YOLO detections and context to predict priority (Low, Medium, High).
"""

from typing import Dict, Any, List
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
import joblib
from pathlib import Path


class WasteSeverityML:
    def __init__(self, model_file: str = "ai/severity_model/severity_gb.pkl"):
        self.model_path = Path(model_file)
        self.classes = ["Low", "Medium", "High"]
        self.feature_names = [
            "total_detections",
            "waste_coverage_pct",
            "avg_confidence",
            "max_bbox_area_ratio",
            "nearby_past_reports",
        ]
        self.model = self._load_or_train_baseline()

    def _generate_synthetic_baseline_data(self):
        """Generates realistic synthetic data to initialize the tabular model."""
        np.random.seed(42)
        n = 500

        # Features
        det_count = np.random.randint(0, 15, size=n)
        coverage = np.random.uniform(0.0, 70.0, size=n)
        avg_conf = np.random.uniform(0.3, 0.95, size=n)
        max_area = np.random.uniform(0.01, 0.5, size=n)
        past_rep = np.random.randint(0, 20, size=n)

        X = np.column_stack([det_count, coverage, avg_conf, max_area, past_rep])

        # Labels: 0 = Low, 1 = Medium, 2 = High
        y = []
        for i in range(n):
            score = (det_count[i] * 1.5) + (coverage[i] * 1.2) + (past_rep[i] * 1.0)
            if score > 45:
                y.append(2)  # High
            elif score > 18:
                y.append(1)  # Medium
            else:
                y.append(0)  # Low

        return X, np.array(y)

    def _load_or_train_baseline(self):
        if self.model_path.exists():
            return joblib.load(self.model_path)

        # Train baseline GradientBoosting model
        X, y = self._generate_synthetic_baseline_data()
        clf = GradientBoostingClassifier(n_estimators=50, random_state=42)
        clf.fit(X, y)

        self.model_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(clf, self.model_path)
        return clf

    def predict(
        self,
        total_detections: int,
        waste_coverage_pct: float,
        avg_confidence: float = 0.75,
        max_bbox_area_ratio: float = 0.15,
        nearby_past_reports: int = 2,
    ) -> Dict[str, Any]:
        """Predict priority and return probabilities and top feature drivers."""
        features = np.array([[
            total_detections,
            waste_coverage_pct,
            avg_confidence,
            max_bbox_area_ratio,
            nearby_past_reports,
        ]])

        pred_idx = int(self.model.predict(features)[0])
        probs = self.model.predict_proba(features)[0]
        level = self.classes[pred_idx]

        # Feature importances / explanation drivers
        importances = self.model.feature_importances_
        top_driver_idx = int(np.argmax(importances))
        top_driver = self.feature_names[top_driver_idx]

        return {
            "predicted_severity": level,
            "confidence_probabilities": {
                "Low": round(float(probs[0]), 3),
                "Medium": round(float(probs[1]), 3),
                "High": round(float(probs[2]), 3),
            },
            "top_driving_feature": top_driver,
            "explanation": f"Classified as {level} based on {total_detections} items and {waste_coverage_pct}% area coverage.",
        }
