"""Calculate busyScore, demandScore, and futureBusy for amenity slots."""

from services.prediction_service import predict_future_busy


def calculate_busy_score(booked: int, capacity: int) -> float:
    """Busy score = ratio of booked seats to total capacity (0.0-1.0)."""
    if capacity <= 0:
        return 0.0
    return round(min(booked / capacity, 1.0), 2)


def calculate_demand_score(
    booked: int,
    capacity: int,
    waitlist: int,
) -> float:
    """Demand score includes waitlist pressure on top of occupancy."""
    if capacity <= 0:
        return 0.0
    occupancy = booked / capacity
    waitlist_pressure = waitlist / capacity
    return round(min(occupancy + (waitlist_pressure * 0.5), 1.5), 2)


def recalculate_slot_scores(slot: dict) -> dict:
    """Refresh all score fields after reservation/cancellation/waitlist events."""
    slot["busyScore"] = calculate_busy_score(slot["booked"], slot["capacity"])
    slot["demandScore"] = calculate_demand_score(
        slot["booked"],
        slot["capacity"],
        slot.get("waitlist", 0),
    )
    slot["futureBusy"] = predict_future_busy(slot)
    return slot


def enrich_slots_with_scores(slots: list[dict]) -> list[dict]:
    """Add score fields to every slot dict."""
    for slot in slots:
        recalculate_slot_scores(slot)
    return slots
