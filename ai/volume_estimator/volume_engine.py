"""
Dump Volume & Tonnage Estimation AI Engine
Karachi WasteWatch AI - Option 4
Estimates pile volume (m³), mass (kg / metric tons), dimensions, and vehicle fleet dispatch recommendation.
"""

from typing import List, Dict, Any, Optional
import math


# Typical uncompacted bulk density in kilograms per cubic meter (kg/m³) for Karachi municipal waste
MATERIAL_DENSITIES_KG_M3 = {
    "plastic": 85.0,
    "bag": 75.0,
    "bottle": 90.0,
    "paper": 120.0,
    "cardboard": 140.0,
    "can": 160.0,
    "metal": 380.0,
    "glass": 450.0,
    "food": 580.0,
    "organic": 520.0,
    "yard": 310.0,
    "debris": 1250.0,
    "rubble": 1350.0,
    "trash": 300.0,
    "garbage": 300.0,
    "refuse": 300.0,
}
DEFAULT_MSW_DENSITY = 280.0  # Mixed street garbage baseline


class DumpVolumeEstimator:
    """
    Computes 3D volumetric footprint, estimated mass/tonnage, and fleet dispatch recommendation
    using bounding box perspective geometry and material density coefficients.
    """

    def estimate(
        self,
        detections: List[Dict[str, Any]],
        image_dimensions: Optional[Dict[str, int]] = None,
        waste_coverage_pct: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Estimate waste volume in m³ and weight in metric tons.
        """
        if not detections or waste_coverage_pct < 0.2:
            return {
                "estimated_volume_m3": 0.0,
                "estimated_weight_kg": 0.0,
                "estimated_tonnage": 0.0,
                "volume_category": "Clean / Zero Waste",
                "pile_dimensions": {"length_m": 0.0, "width_m": 0.0, "height_m": 0.0},
                "dispatch_recommendation": {
                    "vehicle_type": "None Needed",
                    "crew_size": "0 Workers",
                    "estimated_time": "0 minutes",
                    "fuel_category": "N/A",
                },
                "density_applied_kg_m3": 0.0,
            }

        # 1. Image reference dimensions
        img_w = (image_dimensions or {}).get("width", 800)
        img_h = (image_dimensions or {}).get("height", 600)
        img_total_pixels = float(img_w * img_h)

        # 2. Compute effective ground footprint in meters
        # In municipal civic photography (taken standing at 1.5 - 3.5m distance),
        # an entire frame corresponds approximately to a 3.5m x 2.6m ground surface view (~9 m² ground field of view).
        GROUND_FOV_AREA_M2 = 9.2

        # Sum of normalized bounding box areas
        total_bbox_area_pixels = sum(
            max(0.0, d.get("bbox", [0, 0, 0, 0])[2] - d.get("bbox", [0, 0, 0, 0])[0]) *
            max(0.0, d.get("bbox", [0, 0, 0, 0])[3] - d.get("bbox", [0, 0, 0, 0])[1])
            for d in detections
        )
        norm_coverage = min(1.0, max(0.02, total_bbox_area_pixels / img_total_pixels if img_total_pixels > 0 else 0.1))

        # Ground footprint area in square meters
        footprint_area_m2 = round(norm_coverage * GROUND_FOV_AREA_M2, 2)

        # 3. Model pile 3D mound geometry:
        # Street garbage piles typically form a rounded mound / heap.
        # Length and Width approximate an ellipse: Area = pi * (L/2) * (W/2)
        aspect_ratio = 1.4  # Piles along roadside curbs are slightly elongated
        width_m = round(math.sqrt(footprint_area_m2 / (math.pi / 4 * aspect_ratio)), 2)
        length_m = round(width_m * aspect_ratio, 2)

        # Height of pile: typically 0.2m for scattered litter up to 1.8m for huge heaps
        if norm_coverage < 0.10:
            height_m = round(0.15 + (norm_coverage * 1.5), 2)
        elif norm_coverage < 0.35:
            height_m = round(0.35 + (norm_coverage * 1.8), 2)
        else:
            height_m = round(0.70 + (norm_coverage * 1.4), 2)

        # Volumetric heap formula: V = (2/3) * (pi/4 * L * W) * H = (2/3) * Area * H
        volume_m3 = round((2.0 / 3.0) * footprint_area_m2 * height_m, 2)
        # Ensure realistic lower and upper bounds
        volume_m3 = max(0.05, volume_m3)

        # 4. Material-Weighted Density Calculation
        density_acc = 0.0
        count = len(detections)
        for det in detections:
            cname = det.get("class_name", "").lower()
            matched_density = DEFAULT_MSW_DENSITY
            for key, val in MATERIAL_DENSITIES_KG_M3.items():
                if key in cname:
                    matched_density = val
                    break
            density_acc += matched_density

        avg_density = density_acc / count if count > 0 else DEFAULT_MSW_DENSITY
        weight_kg = round(volume_m3 * avg_density, 1)
        tonnage = round(weight_kg / 1000.0, 2)

        # 5. Volume Category & Fleet Dispatch Advice
        if volume_m3 < 0.25:
            vol_cat = "Micro-Litter (Minor Scattering)"
            vehicle = "Manual Bin Handcart & Sweeper Broom"
            crew = "1 Municipal Sweeper"
            est_time = "15 - 20 minutes"
            fuel_cat = "Zero Emission (Manual)"
        elif volume_m3 < 1.2:
            vol_cat = "Small Refuse Pile (1-3 m³ load)"
            vehicle = "Mini Suzuki Tipper (1-Ton Open Bed)"
            crew = "2 Sanitation Workers"
            est_time = "30 - 45 minutes"
            fuel_cat = "Light Commercial Fuel"
        elif volume_m3 < 4.0:
            vol_cat = "Medium Street Heap (Standard Dump)"
            vehicle = "5-Ton Arm-Roll Mini Compactor Truck"
            crew = "3 Sanitation Workers + Driver"
            est_time = "45 - 75 minutes"
            fuel_cat = "Medium Fleet Compactor"
        else:
            vol_cat = "Major Illegal Dumping / Overflowing Site"
            vehicle = "10-Ton Heavy Hydraulic Compactor + Tractor Loader"
            crew = "4-5 Workers + Heavy Equipment Operator"
            est_time = "1.5 - 3.0 hours"
            fuel_cat = "Heavy Industrial Diesel Unit"

        return {
            "estimated_volume_m3": volume_m3,
            "estimated_weight_kg": weight_kg,
            "estimated_tonnage": tonnage,
            "volume_category": vol_cat,
            "pile_dimensions": {
                "length_m": length_m,
                "width_m": width_m,
                "height_m": height_m,
                "ground_footprint_m2": footprint_area_m2,
            },
            "dispatch_recommendation": {
                "vehicle_type": vehicle,
                "crew_size": crew,
                "estimated_time": est_time,
                "fuel_category": fuel_cat,
            },
            "density_applied_kg_m3": round(avg_density, 1),
        }


# Global singleton
volume_estimator = DumpVolumeEstimator()
