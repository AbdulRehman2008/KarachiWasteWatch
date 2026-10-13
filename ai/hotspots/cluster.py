"""
DBSCAN Geospatial Hotspot Detection for Karachi (Phase 7 & 11)
Groups waste incident coordinates using Haversine distance DBSCAN clustering.
"""

from typing import List, Dict, Any
import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN


def detect_karachi_hotspots(
    reports: List[Dict[str, Any]],
    epsilon_meters: float = 300.0,
    min_reports: int = 3,
) -> Dict[str, Any]:
    """
    Cluster reports within `epsilon_meters` of each other into hotspots.

    Args:
        reports: list of dicts with 'latitude', 'longitude', 'district', 'id'
        epsilon_meters: max distance between two reports to be considered in the same cluster
        min_reports: minimum number of reports to form a hotspot

    Returns:
        Dict with identified clusters, noise points, and cluster summary.
    """
    if len(reports) < min_reports:
        return {"hotspots": [], "total_hotspots": 0, "message": "Not enough reports to run clustering."}

    df = pd.DataFrame(reports)
    # Convert lat/lng to radians for haversine metric
    coords_rad = np.radians(df[["latitude", "longitude"]].values)

    # 6371000m is earth radius; eps in radians = eps_meters / earth_radius
    eps_rad = epsilon_meters / 6371000.0

    db = DBSCAN(eps=eps_rad, min_samples=min_reports, metric="haversine")
    df["cluster"] = db.fit_predict(coords_rad)

    hotspots = []
    # Cluster -1 represents noise / isolated reports
    unique_clusters = [c for c in df["cluster"].unique() if c != -1]

    for cluster_id in unique_clusters:
        c_df = df[df["cluster"] == cluster_id]
        center_lat = float(c_df["latitude"].mean())
        center_lng = float(c_df["longitude"].mean())
        district = c_df["district"].mode().iloc[0] if "district" in c_df else "Karachi"

        hotspots.append({
            "cluster_id": int(cluster_id),
            "district": district,
            "center_latitude": round(center_lat, 5),
            "center_longitude": round(center_lng, 5),
            "report_count": len(c_df),
            "report_ids": c_df["id"].tolist() if "id" in c_df else [],
            "risk_level": "High" if len(c_df) >= 7 else "Medium",
        })

    return {
        "hotspots": sorted(hotspots, key=lambda x: x["report_count"], reverse=True),
        "total_hotspots": len(hotspots),
        "clustered_reports_count": int((df["cluster"] != -1).sum()),
        "isolated_reports_count": int((df["cluster"] == -1).sum()),
    }
