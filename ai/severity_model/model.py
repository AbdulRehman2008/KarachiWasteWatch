"""
Machine Learning Severity Classifier (Karachi WasteWatch AI)
Uses GradientBoostingClassifier trained on tabular features from YOLO detections and civic context.
Provides multi-class probabilities, continuous severity score, and AI explainability breakdown.
"""

from typing import Dict, Any, List
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
import joblib
from pathlib import Path


class WasteSeverityML:
    def __init__(self, model_file: str = "ai/severity_model/severity_gb.pkl"):
        self.model_path = Path(model_file)
        self.classes = ["Low", "Medium", "High", "Critical"]
        self.feature_names = [
            "total_detections",
            "waste_coverage_pct",
            "avg_confidence",
            "max_bbox_area_ratio",
            "nearby_past_reports",
            "waste_type_count",
        ]
        self.model = self._load_or_train_baseline()

    def _generate_synthetic_baseline_data(self):
        """Generates realistic synthetic civic waste training data."""
        np.random.seed(42)
        n = 1000

        det_count = np.random.randint(0, 18, size=n)
        coverage = np.random.uniform(0.0, 75.0, size=n)
        avg_conf = np.random.uniform(0.3, 0.95, size=n)
        max_area = np.random.uniform(0.0, 0.5, size=n)
        past_rep = np.random.randint(0, 15, size=n)
        type_count = np.random.randint(1, 6, size=n)

        # Force some clean/minimal reports for class 0
        for i in range(150):
            det_count[i] = np.random.randint(0, 3)
            coverage[i] = np.random.uniform(0.0, 5.0)
            past_rep[i] = 0

        X = np.column_stack([det_count, coverage, avg_conf, max_area, past_rep, type_count])

        # Labels: 0 = Low, 1 = Medium, 2 = High, 3 = Critical
        y = []
        for i in range(n):
            score = (
                (det_count[i] * 1.8)
                + (coverage[i] * 1.1)
                + (past_rep[i] * 0.7)
                + (max_area[i] * 20.0)
                + (type_count[i] * 1.5)
            )
            if score > 55:
                y.append(3)  # Critical
            elif score > 28:
                y.append(2)  # High
            elif score > 10:
                y.append(1)  # Medium
            else:
                y.append(0)  # Low

        return X, np.array(y)

    def _load_or_train_baseline(self):
        try:
            if self.model_path.exists():
                model = joblib.load(self.model_path)
                # Verify features count and classes count match
                if (
                    hasattr(model, "n_features_in_")
                    and model.n_features_in_ == len(self.feature_names)
                    and hasattr(model, "classes_")
                    and len(model.classes_) == len(self.classes)
                ):
                    return model
        except Exception:
            pass

        # Train updated GradientBoosting model
        X, y = self._generate_synthetic_baseline_data()
        clf = GradientBoostingClassifier(n_estimators=75, learning_rate=0.1, max_depth=3, random_state=42)
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
        nearby_past_reports: int = 1,
        waste_type_count: int = 1,
    ) -> Dict[str, Any]:
        """
        Predict priority with probabilities, continuous severity score, and feature importance drivers.
        """
        # Edge case: 0 detections
        if total_detections == 0 and waste_coverage_pct == 0.0:
            return {
                "predicted_severity": "Clean / None",
                "severity_score": 0.0,
                "confidence_probabilities": {"Low": 1.0, "Medium": 0.0, "High": 0.0, "Critical": 0.0},
                "top_driving_feature": "clean_surface",
                "explanation": "AI detected no waste artifacts in this image. Clean municipal scene.",
            }

        features = np.array([[
            total_detections,
            waste_coverage_pct,
            avg_confidence,
            max_bbox_area_ratio,
            nearby_past_reports,
            waste_type_count,
        ]])

        pred_idx = int(self.model.predict(features)[0])
        probs = self.model.predict_proba(features)[0]
        level = self.classes[pred_idx]

        # Calculate continuous severity score (0.0 to 1.0) weighted by probabilities
        # Weights: Low=0.2, Medium=0.5, High=0.8, Critical=1.0
        weights = [0.2, 0.5, 0.8, 1.0]
        score = sum(p * w for p, w in zip(probs, weights))
        score = round(float(min(1.0, max(0.05, score))), 3)

        # Feature importance / explanation
        importances = self.model.feature_importances_
        # Feature values relative to means
        scaled_contributions = features[0] * importances
        top_driver_idx = int(np.argmax(scaled_contributions))
        top_driver = self.feature_names[top_driver_idx]

        driver_labels = {
            "total_detections": f"high object count ({total_detections} items)",
            "waste_coverage_pct": f"extensive ground coverage ({waste_coverage_pct:.1f}%)",
            "avg_confidence": f"high detection confidence ({avg_confidence:.0%})",
            "max_bbox_area_ratio": f"large single waste heap ({max_bbox_area_ratio:.0%})",
            "nearby_past_reports": f"recurring zone history ({nearby_past_reports} nearby reports)",
            "waste_type_count": f"mixed waste diversity ({waste_type_count} material types)",
        }
        driver_explanation = driver_labels.get(top_driver, top_driver)

        explanation = (
            f"Classified as {level} priority (Score: {score}) driven primarily by {driver_explanation}. "
            f"{total_detections} items identified across {waste_coverage_pct:.1f}% of frame."
        )

        prob_dict = {
            cls_name: round(float(probs[i]), 3)
            for i, cls_name in enumerate(self.classes)
        }

        return {
            "predicted_severity": level,
            "severity_score": score,
            "confidence_probabilities": prob_dict,
            "top_driving_feature": top_driver,
            "explanation": explanation,
        }
