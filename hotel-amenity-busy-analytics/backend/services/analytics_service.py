"""Busy-time analytics and smart recommendations for amenity slots."""

from data.mock_slots import is_slot_open_for_amenity
from services.score_service import enrich_slots_with_scores


def get_busy_analytics(
    slots: list[dict],
    amenity: str,
) -> list[dict]:
    """Filter slots for the requested amenity and enrich with scores."""
    filtered = [
        s for s in slots
        if s["amenity"] == amenity and is_slot_open_for_amenity(s)
    ]
    return enrich_slots_with_scores(filtered)


def _recommendation_reason(slot: dict) -> str:
    """Compose deterministic, amenity-specific recommendation copy."""
    amenity = slot["amenity"]
    time_slot = slot["timeSlot"]
    weather = slot.get("weatherCondition", "clear")
    traffic = slot.get("trafficCondition", "light")

    if amenity == "Free Breakfast":
        return f"A smoother breakfast window around {time_slot}; good for grabbing a table before the rush builds."
    if amenity == "Pool":
        return f"A calmer pool window around {time_slot}; better for lounge chairs and less crowded swim time."
    if amenity == "Fitness Center":
        return f"A good workout window around {time_slot}; equipment should be easier to access."
    if amenity == "Lounges":
        return f"A comfortable lounge window around {time_slot}; useful for a quieter drink or meeting spot."
    if amenity == "Cabanas":
        return f"A better cabana window around {time_slot}; availability looks more favorable for a relaxed poolside block."
    if amenity == "EV Charging":
        return f"A practical EV charging window around {time_slot}; fewer conflicts expected for charger access."
    if amenity == "Golf":
        return f"A favorable golf window around {time_slot}; demand is lighter for tee-time planning."
    if amenity == "Spa":
        return f"A calmer spa window around {time_slot}; better for booking treatments with less schedule pressure."
    if amenity == "Tennis":
        return f"A suitable tennis window around {time_slot}; court demand should be easier to manage."

    return f"Recommended around {time_slot}; conditions look manageable with {weather} weather and {traffic} traffic."


def get_recommendations(
    slots: list[dict],
    amenity: str,
    top_n: int = 5,
) -> list[dict]:
    """Return top recommendation windows for the requested amenity."""
    enriched = get_busy_analytics(slots, amenity)
    available_slots = [s for s in enriched if s["available"] > 0]
    available_slots.sort(key=lambda s: (s["futureBusy"], s["busyScore"]))

    recommendations = []
    for slot in available_slots[:top_n]:
        recommendations.append(
            {
                "slotId": slot["slotId"],
                "date": slot["date"],
                "timeSlot": slot["timeSlot"],
                "reason": _recommendation_reason(slot),
                "busyScore": slot["busyScore"],
                "futureBusy": slot["futureBusy"],
                "available": slot["available"],
            }
        )

    return recommendations
