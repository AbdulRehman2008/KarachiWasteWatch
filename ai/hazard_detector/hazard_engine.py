"""
Hazardous & Bio-Medical Waste AI Detection Engine
Karachi WasteWatch AI - Option 3
Detects bio-medical, clinical, toxic, chemical, sharp, and decaying biological hazards.
Computes risk level, PPE requirements, quarantine radius, and specialized HAZMAT fleet dispatch.
"""

from typing import List, Dict, Any, Optional
from pathlib import Path
import re


HAZARD_TAXONOMY = {
    # 1. Bio-Medical & Clinical Waste
    "syringe": {
        "type": "Bio-Medical / Sharps",
        "level": "CRITICAL HAZARD",
        "description": "Used medical syringe, needle, or intravenous tubing (blood-borne pathogen risk).",
        "ppe": ["Puncture-Resistant Kevlar Gloves", "Bio-Hazard N95 Mask", "Safety Goggles"],
        "containment": "Do NOT handle directly. Pick up using mechanical tongs into a rigid yellow sharps puncture-proof container.",
        "team": "SSWMB & Sindh EPA Bio-Medical HAZMAT Rapid Response Cell",
    },
    "needle": {
        "type": "Bio-Medical / Sharps",
        "level": "CRITICAL HAZARD",
        "description": "Sharp medical needle or lancet with infectious exposure danger.",
        "ppe": ["Puncture-Resistant Kevlar Gloves", "Bio-Hazard N95 Mask", "Safety Goggles"],
        "containment": "Deposit into yellow biohazard sharps container. Disinfect area with 0.5% sodium hypochlorite.",
        "team": "SSWMB & Sindh EPA Bio-Medical HAZMAT Rapid Response Cell",
    },
    "medicine": {
        "type": "Pharmaceutical Waste",
        "level": "HIGH HAZARD",
        "description": "Expired pharmaceutical blister packs, discarded medication bottles or vials.",
        "ppe": ["Nitrile Heavy Duty Gloves", "Protective Mask"],
        "containment": "Collect in sealed chemical bag for municipal high-temperature incineration.",
        "team": "SSWMB Pharmaceutical Disposal Cell",
    },
    "hospital": {
        "type": "Clinical / Infectious",
        "level": "CRITICAL HAZARD",
        "description": "Hospital clinical waste, contaminated dressings, or specimen containers.",
        "ppe": ["Full Biohazard Tyvek Suit", "Heavy Nitrile Gloves", "N95 Respirator"],
        "containment": "Immediate 10-meter quarantine perimeter. Pack in double yellow biohazard leak-proof bags.",
        "team": "SSWMB & Sindh EPA Bio-Medical HAZMAT Rapid Response Cell",
    },
    "blood": {
        "type": "Bio-Medical / Infectious",
        "level": "CRITICAL HAZARD",
        "description": "Blood-contaminated refuse or clinical gauze swabs.",
        "ppe": ["Full Biohazard PPE", "Double Nitrile Gloves", "Face Shield"],
        "containment": "Disinfect with active chlorine and seal in infectious waste containers.",
        "team": "SSWMB Specialized Bio-Hazard Fleet",
    },

    # 2. Toxic & Chemical Hazards
    "battery": {
        "type": "Chemical & Heavy Metal",
        "level": "HIGH HAZARD",
        "description": "Lead-acid or lithium battery leaking toxic acid, cadmium, and corrosive chemicals.",
        "ppe": ["Acid-Resistant Rubber Gloves", "Eye Splash Goggles", "Chemical Apron"],
        "containment": "Place inside corrosion-proof plastic drum with baking soda / neutralizing absorbent.",
        "team": "SSWMB Industrial Chemical & E-Waste Team",
    },
    "chemical": {
        "type": "Toxic Chemical",
        "level": "CRITICAL HAZARD",
        "description": "Discarded chemical container, solvent drum, or industrial pesticide bottle.",
        "ppe": ["Chemical Splash Suit", "Vapor Respirator Mask", "Neoprene Gloves"],
        "containment": "Do not inhale fumes. Secure 15-meter zone and isolate from municipal storm drains.",
        "team": "Sindh EPA Hazardous Chemical Emergency Unit",
    },
    "paint": {
        "type": "Chemical / Solvent",
        "level": "HIGH HAZARD",
        "description": "Industrial paint cans, thinners, or solvent containers with VOC fire hazard.",
        "ppe": ["Vapor Mask", "Solvent-Proof Gloves"],
        "containment": "Prevent spillage into gutters; collect for specialized chemical stabilization.",
        "team": "SSWMB Toxic Refuse Unit",
    },
    "oil": {
        "type": "Petrochemical Waste",
        "level": "HIGH HAZARD",
        "description": "Automotive engine oil or toxic petrochemical sludge.",
        "ppe": ["Oil-Resistant Rubber Gloves", "Boots"],
        "containment": "Apply sand or sawdust absorbent bunding immediately to stop runoff.",
        "team": "SSWMB Drainage Protection Unit",
    },
    "electronic": {
        "type": "E-Waste Toxic Metal",
        "level": "HIGH HAZARD",
        "description": "Broken cathode-ray tubes, PCB boards, or mercury/lead electronic scrap.",
        "ppe": ["Cut-Resistant Gloves", "Dust Mask"],
        "containment": "Store dry to prevent groundwater lead leaching; route to certified E-waste recycler.",
        "team": "SSWMB E-Waste Recovery Unit",
    },

    # 3. Biological & Decaying Animal Waste
    "carcass": {
        "type": "Biological Decaying Matter",
        "level": "CRITICAL HAZARD",
        "description": "Decomposing animal remains / carcass with high vector-borne disease and odor danger.",
        "ppe": ["Heavy Rubber Gloves", "Disinfectant Sprayer", "Organic Vapor Respirator", "Rubber Boots"],
        "containment": "Disinfect surrounding ground with lime powder; transport in sealed animal disposal van for sanitary burial.",
        "team": "SSWMB Animal & Bio-Remains Rapid Disposal Cell",
    },
    "offal": {
        "type": "Biological Decaying Matter",
        "level": "CRITICAL HAZARD",
        "description": "Slaughterhouse or post-Eid animal offal and entrails decomposing openly.",
        "ppe": ["Waterproof Gauntlets", "Full Face Shield", "Rubber Overboots"],
        "containment": "Apply agricultural lime powder immediately and dispatch covered tipper for deep pit burial.",
        "team": "SSWMB Special Eid / Slaughter Waste Unit",
    },

    # 4. Sharp & Physical Trauma Hazards
    "glass": {
        "type": "Physical Hazard / Sharps",
        "level": "MODERATE HAZARD",
        "description": "Broken glass bottles, shards, or shattered window panes.",
        "ppe": ["Puncture-Resistant Heavy Leather/Kevlar Gloves", "Steel-Toe Boots"],
        "containment": "Sweep using stiff brooms into rigid puncture-resistant bins; do not use thin polythene bags.",
        "team": "Standard SSWMB Sweeper Crew with Heavy Protective Gear",
    },
}


class HazardDetectionEngine:
    """
    Evaluates detection objects, descriptions, and visual properties to determine
    if hazardous or bio-medical waste is present.
    """

    def analyze(
        self,
        detections: List[Dict[str, Any]],
        description: Optional[str] = "",
        image_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Analyze detections and textual metadata for bio-medical and toxic hazards.
        """
        detected_hazards = []
        highest_level = "SAFE / LOW"
        primary_hazard_type = "None"
        selected_meta = None

        search_tokens = []
        for det in detections:
            cls = det.get("class_name", "").lower()
            search_tokens.append(cls)

        if description:
            search_tokens.extend(re.findall(r"\w+", description.lower()))

        joined_text = " ".join(search_tokens)

        # Match against hazard taxonomy
        for key, meta in HAZARD_TAXONOMY.items():
            if key in joined_text:
                detected_hazards.append({
                    "keyword": key,
                    "hazard_type": meta["type"],
                    "hazard_level": meta["level"],
                    "description": meta["description"],
                })

                # Escalation logic
                if meta["level"] == "CRITICAL HAZARD":
                    highest_level = "CRITICAL HAZARD"
                    primary_hazard_type = meta["type"]
                    selected_meta = meta
                elif meta["level"] == "HIGH HAZARD" and highest_level != "CRITICAL HAZARD":
                    highest_level = "HIGH HAZARD"
                    primary_hazard_type = meta["type"]
                    selected_meta = meta
                elif meta["level"] == "MODERATE HAZARD" and highest_level in ["SAFE / LOW", "MODERATE HAZARD"]:
                    highest_level = "MODERATE HAZARD"
                    primary_hazard_type = meta["type"]
                    selected_meta = meta

        is_hazardous = len(detected_hazards) > 0 and highest_level != "SAFE / LOW"

        if is_hazardous and selected_meta:
            ppe = selected_meta["ppe"]
            containment = selected_meta["containment"]
            team = selected_meta["team"]
            quarantine_radius = "15 meters" if highest_level == "CRITICAL HAZARD" else "5 meters"
            priority_action = f"EMERGENCY HAZMAT PROTOCOL: {selected_meta['description']}"
        else:
            ppe = ["Standard municipal safety vest", "Work gloves"]
            containment = "Standard municipal containerization and compaction."
            team = "General Municipal Sanitation Fleet"
            quarantine_radius = "0 meters"
            priority_action = "Standard civic waste collection."

        return {
            "is_hazardous": is_hazardous,
            "hazard_level": highest_level,
            "hazard_type": primary_hazard_type,
            "hazard_count": len(detected_hazards),
            "detected_hazards": detected_hazards,
            "safety_protocol": {
                "ppe_required": ppe,
                "containment_instructions": containment,
                "quarantine_radius": quarantine_radius,
                "specialized_team": team,
            },
            "priority_action": priority_action,
        }


# Global singleton
hazard_engine = HazardDetectionEngine()
