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
    """Return the top-N least-busy slots for the requested amenity."""
    enriched = get_busy_analytics(slots, amenity)
    available_slots = [s for s in enriched if s["available"] > 0]
    available_slots.sort(key=lambda s: (s["futureBusy"], s["busyScore"]))

    recommendations = []
    for slot in available_slots[:top_n]:
        if slot["futureBusy"] <= 0.3:
            reason = "Demand is light. Recommended for a quieter visit."
        elif slot["futureBusy"] <= 0.6:
            reason = "Demand is moderate. Recommended if this time fits your stay plan."
        else:
            reason = "Demand is high. Consider this only if your schedule is limited."

        recommendations.append(
            {
                "slotId": slot["slotId"],
                "date": slot["date"],
                "timeSlot": slot["timeSlot"],
                "reason": reason,
                "busyScore": slot["busyScore"],
                "futureBusy": slot["futureBusy"],
                "available": slot["available"],
            }
        )

    return recommendations
