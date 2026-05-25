"""Calculate busyScore, demandScore, and futureBusy for amenity slots."""


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


def _weather_score(condition: str) -> float:
    value = (condition or "").strip().lower()
    if value in {"severe", "storm", "hurricane", "extreme"}:
        return 1.0
    if value in {"rain", "heat", "snow", "wind", "hot"}:
        return 0.65
    if value in {"cloudy", "overcast", "moderate"}:
        return 0.35
    return 0.1


def _traffic_score(condition: str) -> float:
    value = (condition or "").strip().lower()
    if value in {"severe", "heavy", "high", "congested"}:
        return 1.0
    if value in {"moderate", "medium"}:
        return 0.55
    if value in {"light", "low"}:
        return 0.15
    return 0.25


def calculate_future_busy_score(slot: dict) -> float:
    """Lightweight request-time forecast from normalized canonical dataset signals."""
    busy = slot.get("busyScore")
    demand = slot.get("demandScore")
    if busy is None:
        busy = calculate_busy_score(slot["booked"], slot["capacity"])
    if demand is None:
        demand = calculate_demand_score(slot["booked"], slot["capacity"], slot.get("waitlist", 0))

    weather = _weather_score(slot.get("weatherCondition", "clear"))
    traffic = _traffic_score(slot.get("trafficCondition", "light"))
    return round(min(1.0, busy * 0.52 + min(demand, 1.5) * 0.24 + weather * 0.12 + traffic * 0.12), 2)


def recalculate_slot_scores(slot: dict) -> dict:
    """Refresh all score fields after reservation/cancellation/waitlist events."""
    slot["busyScore"] = calculate_busy_score(slot["booked"], slot["capacity"])
    slot["demandScore"] = calculate_demand_score(
        slot["booked"],
        slot["capacity"],
        slot.get("waitlist", 0),
    )
    slot["futureBusy"] = calculate_future_busy_score(slot)
    return slot


def enrich_slots_with_scores(slots: list[dict]) -> list[dict]:
    """Ensure score fields are present without expensive per-slot model training."""
    for slot in slots:
        if "busyScore" not in slot:
            slot["busyScore"] = calculate_busy_score(slot["booked"], slot["capacity"])
        if "demandScore" not in slot:
            slot["demandScore"] = calculate_demand_score(
                slot["booked"],
                slot["capacity"],
                slot.get("waitlist", 0),
            )
        if "futureBusy" not in slot:
            slot["futureBusy"] = calculate_future_busy_score(slot)
    return slots
