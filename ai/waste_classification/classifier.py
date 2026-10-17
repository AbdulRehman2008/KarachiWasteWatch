"""
Municipal Waste Categorization, Recyclability & Carbon Impact AI Engine
Karachi WasteWatch AI
Categorizes computer vision detections into waste streams, estimates recyclability percentage,
and computes carbon diversion offset potential.
"""

from typing import List, Dict, Any


# Municipal categorization taxonomy for Karachi solid waste streams
CATEGORY_MAP = {
    # Recyclable streams
    "bottle": "Recyclable",
    "plastic": "Recyclable",
    "can": "Recyclable",
    "tin": "Recyclable",
    "cardboard": "Recyclable",
    "paper": "Recyclable",
    "glass": "Recyclable",
    "cup": "Recyclable",
    "box": "Recyclable",

    # Organic streams
    "food": "Organic / Compostable",
    "organic": "Organic / Compostable",
    "peel": "Organic / Compostable",
    "fruit": "Organic / Compostable",
    "vegetable": "Organic / Compostable",
    "leaf": "Organic / Compostable",
    "tree": "Organic / Compostable",

    # Hazardous streams
    "battery": "Hazardous",
    "chemical": "Hazardous",
    "medicine": "Hazardous",
    "syringe": "Hazardous",
    "electronic": "Hazardous",
    "oil": "Hazardous",
    "paint": "Hazardous",
}

DISPOSAL_RECOMMENDATIONS = {
    "Recyclable": "Dispatch to District Material Recovery Facility (MRF) for mechanical sorting and recycling.",
    "Organic / Compostable": "Direct to Municipal Composting Plant or Bio-waste digestion facility.",
    "Hazardous": "Immediate containment required. Dispatch specialized Hazmat Sanitation Fleet.",
    "General Landfill": "Collect for standard compacting and transfer to Jam Chakro or Gond Pass landfill.",
}


class WasteMaterialClassifier:
    def __init__(self):
        self.category_weights = {
            "Recyclable": 1.0,
            "Organic / Compostable": 0.8,
            "General Landfill": 0.3,
            "Hazardous": 0.0,
        }

    def classify_detection(self, class_name: str) -> str:
        """Map raw YOLO class name to civic waste stream."""
        name_lower = class_name.lower()
        for key, cat in CATEGORY_MAP.items():
            if key in name_lower:
                return cat
        return "General Landfill"

    def analyze_stream(self, detections: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze a list of detected waste items and compute stream breakdown,
        recyclability index, hazard score, and estimated carbon offset.
        """
        if not detections:
            return {
                "dominant_material": "Clean / None",
                "stream_breakdown": {},
                "recyclability_pct": 0.0,
                "hazard_level": "None",
                "carbon_offset_kg": 0.0,
                "recommended_action": "No municipal collection required. Area verified clean.",
            }

        stream_counts = {
            "Recyclable": 0,
            "Organic / Compostable": 0,
            "General Landfill": 0,
            "Hazardous": 0,
        }

        for det in detections:
            cat = self.classify_detection(det.get("class_name", ""))
            stream_counts[cat] = stream_counts.get(cat, 0) + 1

        total = len(detections)
        stream_pcts = {
            k: round((v / total) * 100.0, 1)
            for k, v in stream_counts.items()
            if v > 0
        }

        # Dominant stream
        dominant_stream = max(stream_counts, key=stream_counts.get)

        # Recyclability metric
        recyclable_count = stream_counts["Recyclable"]
        recyclability_pct = round((recyclable_count / total) * 100.0, 1)

        # Hazard assessment
        haz_count = stream_counts["Hazardous"]
        if haz_count > 0:
            hazard_level = "High" if haz_count >= 2 else "Medium"
        else:
            hazard_level = "Low"

        # Estimated carbon offset potential (standard ~1.4kg CO2 saved per kg of recycled MSW)
        # Assuming average 0.25kg per detected item
        carbon_offset_kg = round(recyclable_count * 0.25 * 1.4, 2)

        recommendation = DISPOSAL_RECOMMENDATIONS.get(
            "Hazardous" if haz_count > 0 else dominant_stream,
            DISPOSAL_RECOMMENDATIONS["General Landfill"]
        )

        return {
            "dominant_material": dominant_stream,
            "stream_breakdown": stream_pcts,
            "recyclability_pct": recyclability_pct,
            "hazard_level": hazard_level,
            "carbon_offset_kg": carbon_offset_kg,
            "recommended_action": recommendation,
        }
