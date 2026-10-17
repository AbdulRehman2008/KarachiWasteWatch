"""
Anti-Fraud, Duplicate Perception & Image Authenticity AI Engine
Karachi WasteWatch AI - Option 7
Protects municipal resources against image reuse, duplicate submissions,
stock internet photos, EXIF tampering, and GPS location spoofing.
"""

from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
from datetime import datetime
import math
from PIL import Image, ExifTags


def compute_dhash(image_path: str, hash_size: int = 8) -> str:
    """
    Compute Difference Hash (dHash) for an image.
    Generates a 64-bit perceptual fingerprint resistant to scaling, JPEG compression,
    and minor color variations.
    """
    try:
        with Image.open(image_path) as img:
            # Convert to grayscale and resize to (width + 1, height)
            gray = img.convert("L").resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
            pixels = list(gray.getdata())

            # Compare adjacent pixels
            diff = []
            for row in range(hash_size):
                for col in range(hash_size):
                    left = pixels[row * (hash_size + 1) + col]
                    right = pixels[row * (hash_size + 1) + col + 1]
                    diff.append(1 if left > right else 0)

            # Convert 64 bits to 16-character hexadecimal string
            decimal_val = 0
            for bit in diff:
                decimal_val = (decimal_val << 1) | bit
            return f"{decimal_val:016x}"
    except Exception as e:
        print(f"Error computing dHash: {e}")
        return "0000000000000000"


def hamming_distance(hash1: str, hash2: str) -> int:
    """
    Calculate the Hamming distance (number of differing bits) between two hex hashes.
    Distance 0 = identical image.
    Distance <= 8 = near-identical / duplicate image.
    Distance > 15 = distinctly different images.
    """
    try:
        val1 = int(hash1, 16)
        val2 = int(hash2, 16)
        xor_val = val1 ^ val2
        return bin(xor_val).count("1")
    except Exception:
        return 64


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Compute distance in kilometers between two GPS points."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = (math.sin(dphi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2.0) ** 2)
    return R * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))


class AntiFraudEngine:
    """
    Validates civic reports for digital authenticity, visual duplication,
    and metadata tampering.
    """

    def inspect_exif_metadata(
        self,
        image_path: str,
        claimed_lat: Optional[float] = None,
        claimed_lon: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Inspect EXIF metadata for camera hardware signs, manipulation software,
        capture timestamp, and embedded GPS.
        """
        meta = {
            "has_exif": False,
            "camera_model": None,
            "software_used": None,
            "capture_date": None,
            "exif_gps": None,
            "gps_distance_discrepancy_km": None,
            "is_suspicious_software": False,
            "tamper_flags": [],
        }

        try:
            with Image.open(image_path) as img:
                exif_raw = img._getexif()
                if not exif_raw:
                    meta["tamper_flags"].append("No camera sensor EXIF metadata found (common in web-downloaded or screenshot images).")
                    return meta

                meta["has_exif"] = True
                exif = {ExifTags.TAGS.get(k, k): v for k, v in exif_raw.items()}

                # Camera Make & Model
                make = exif.get("Make", "")
                model = exif.get("Model", "")
                if make or model:
                    meta["camera_model"] = f"{make} {model}".strip()

                # Software editing check
                software = str(exif.get("Software", "")).lower()
                if software:
                    meta["software_used"] = software
                    suspicious_tools = ["photoshop", "gimp", "canva", "lightroom", "picsart", "paint.net"]
                    for tool in suspicious_tools:
                        if tool in software:
                            meta["is_suspicious_software"] = True
                            meta["tamper_flags"].append(f"Image edited with graphic manipulation tool: {software.title()}")
                            break

                # Capture date
                date_str = exif.get("DateTimeOriginal") or exif.get("DateTime")
                if date_str:
                    try:
                        cap_dt = datetime.strptime(str(date_str)[:19], "%Y:%m:%d %H:%M:%S")
                        meta["capture_date"] = cap_dt.isoformat()
                        age_days = (datetime.utcnow() - cap_dt).days
                        if age_days > 180:
                            meta["tamper_flags"].append(f"Photo was taken {age_days} days ago (stale or historical image).")
                    except Exception:
                        pass

                # GPS Cross-Validation
                gps_info = exif.get("GPSInfo")
                if gps_info and claimed_lat is not None and claimed_lon is not None:
                    try:
                        lat_ref = gps_info.get(1, "N")
                        lat_raw = gps_info.get(2)
                        lon_ref = gps_info.get(3, "E")
                        lon_raw = gps_info.get(4)

                        if lat_raw and lon_raw:
                            def to_deg(v):
                                return float(v[0]) + float(v[1]) / 60.0 + float(v[2]) / 3600.0

                            exif_lat = to_deg(lat_raw)
                            if lat_ref == "S":
                                exif_lat = -exif_lat
                            exif_lon = to_deg(lon_raw)
                            if lon_ref == "W":
                                exif_lon = -exif_lon

                            meta["exif_gps"] = {"latitude": round(exif_lat, 5), "longitude": round(exif_lon, 5)}
                            km_diff = round(haversine_km(claimed_lat, claimed_lon, exif_lat, exif_lon), 2)
                            meta["gps_distance_discrepancy_km"] = km_diff

                            if km_diff > 12.0:
                                meta["tamper_flags"].append(
                                    f"GPS Discrepancy: Photo EXIF location is {km_diff} km away from submitted district coordinates!"
                                )
                    except Exception as e:
                        print(f"GPS parse warning: {e}")

        except Exception as e:
            print(f"EXIF parsing error: {e}")

        return meta

    def verify_authenticity(
        self,
        image_path: str,
        existing_report_hashes: List[Dict[str, Any]],
        claimed_lat: Optional[float] = None,
        claimed_lon: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Comprehensive authenticity check:
        1. Computes dHash perceptual fingerprint.
        2. Scans past reports for visual duplicates (Hamming distance <= 8).
        3. Analyzes EXIF metadata and location accuracy.
        4. Calculates composite Authenticity Score (0 - 100%).
        """
        current_hash = compute_dhash(image_path)
        exif_analysis = self.inspect_exif_metadata(image_path, claimed_lat, claimed_lon)

        # Duplicate checking
        closest_match = None
        min_distance = 64

        for rep in existing_report_hashes:
            past_hash = rep.get("image_hash")
            if not past_hash or len(past_hash) < 16:
                continue
            dist = hamming_distance(current_hash, past_hash)
            if dist < min_distance:
                min_distance = dist
                closest_match = rep

        is_visual_duplicate = (min_distance <= 8)
        duplicate_report_id = closest_match.get("report_id") if (is_visual_duplicate and closest_match) else None

        # Authenticity scoring calculation
        score = 100
        flags = list(exif_analysis["tamper_flags"])

        if is_visual_duplicate:
            score -= 65
            flags.insert(0, f"Visual Duplicate: Matches existing report {duplicate_report_id} with {(1.0 - min_distance/64.0)*100:.1f}% perceptual similarity.")

        if exif_analysis["is_suspicious_software"]:
            score -= 25

        if exif_analysis.get("gps_distance_discrepancy_km", 0) and exif_analysis["gps_distance_discrepancy_km"] > 12.0:
            score -= 30

        if not exif_analysis["has_exif"] and not is_visual_duplicate:
            # Minor penalty for lack of EXIF (common when apps strip metadata on upload)
            score -= 10

        score = max(5, min(100, score))

        if score >= 80 and not is_visual_duplicate:
            risk_level = "LOW_RISK"
            status = "PASSED"
            verdict_badge = "Verified Authentic"
        elif score >= 50 and not is_visual_duplicate:
            risk_level = "SUSPICIOUS"
            status = "FLAGGED"
            verdict_badge = "Needs Review"
        else:
            risk_level = "HIGH_RISK"
            status = "REJECTED_DUPLICATE" if is_visual_duplicate else "SUSPICIOUS_FRAUD"
            verdict_badge = "Duplicate / Fraud Alert"

        return {
            "image_hash": current_hash,
            "authenticity_score": score,
            "risk_level": risk_level,
            "status": status,
            "verdict_badge": verdict_badge,
            "is_visual_duplicate": is_visual_duplicate,
            "duplicate_of_report_id": duplicate_report_id,
            "hamming_distance": min_distance if closest_match else None,
            "exif_metadata": exif_analysis,
            "audit_flags": flags,
            "explanation": f"Authenticity Score: {score}/100. Status: {verdict_badge}." + (f" Found {len(flags)} inspection flag(s)." if flags else " Clean original photo verified."),
        }


# Global singleton
anti_fraud_engine = AntiFraudEngine()
