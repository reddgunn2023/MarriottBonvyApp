"""Busy-time analytics and smart recommendations for amenity slots."""

from services.score_service import enrich_slots_with_scores


def get_busy_analytics(
    slots: list[dict],
    amenity: str,
) -> list[dict]:
    """Filter slots for the requested amenity and enrich with scores."""
    filtered = [s for s in slots if s["amenity"] == amenity]
    return enrich_slots_with_scores(filtered)


def get_recommendations(
    slots: list[dict],
    amenity: str,
    top_n: int = 5,
) -> list[dict]:
    """
    Return the top-N least-busy slots for the requested amenity.
    Each recommendation includes a human-readable reason.
    """
    enriched = get_busy_analytics(slots, amenity)
    available_slots = [s for s in enriched if s["available"] > 0]
    available_slots.sort(key=lambda s: s["busyScore"])

    recommendations = []
    for slot in available_slots[:top_n]:
        pct_free = round((slot["available"] / slot["capacity"]) * 100)
        if slot["busyScore"] <= 0.3:
            reason = f"Low demand — {pct_free}% availability"
        elif slot["busyScore"] <= 0.6:
            reason = f"Moderate demand — {pct_free}% availability"
        else:
            reason = f"Filling up but {slot['available']} spot(s) left"

        recommendations.append(
            {
                "slotId": slot["slotId"],
                "date": slot["date"],
                "timeSlot": slot["timeSlot"],
                "reason": reason,
                "busyScore": slot["busyScore"],
                "available": slot["available"],
            }
        )

    return recommendations
