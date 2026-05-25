"""Calculate busyScore and demandScore for amenity slots."""


def calculate_busy_score(booked: int, capacity: int) -> float:
    """Busy score = ratio of booked seats to total capacity (0.0 – 1.0)."""
    if capacity <= 0:
        return 0.0
    return round(min(booked / capacity, 1.0), 2)


def calculate_demand_score(
    booked: int,
    capacity: int,
    waitlist: int,
) -> float:
    """
    Demand score factors in waitlist pressure on top of occupancy.
    Range 0.0 – 1.0+  (can exceed 1.0 when waitlist is large).
    """
    if capacity <= 0:
        return 0.0
    occupancy = booked / capacity
    waitlist_pressure = waitlist / capacity if capacity > 0 else 0.0
    return round(occupancy + (waitlist_pressure * 0.5), 2)


def enrich_slots_with_scores(slots: list[dict]) -> list[dict]:
    """Add busyScore and demandScore to every slot dict."""
    for slot in slots:
        slot["busyScore"] = calculate_busy_score(slot["booked"], slot["capacity"])
        slot["demandScore"] = calculate_demand_score(
            slot["booked"],
            slot["capacity"],
            slot.get("waitlist", 0),
        )
    return slots
