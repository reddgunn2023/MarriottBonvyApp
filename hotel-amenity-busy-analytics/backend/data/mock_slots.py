"""
Mock slot dataset for hotel amenities.
Each slot represents a bookable time window for a specific amenity at a property.
"""

import copy
from datetime import date, timedelta

PROPERTIES = [
    {"id": "prop-001", "name": "Marriott Resort & Spa, Maui"},
    {"id": "prop-002", "name": "The Ritz-Carlton, New York"},
    {"id": "prop-003", "name": "W Hotel, Los Angeles"},
]

AMENITIES = ["Spa", "Pool", "Golf", "Gym", "Tennis", "Kids Club"]

TIME_SLOTS = [
    "06:00-08:00",
    "08:00-10:00",
    "10:00-12:00",
    "12:00-14:00",
    "14:00-16:00",
    "16:00-18:00",
    "18:00-20:00",
    "20:00-22:00",
]

_CAPACITY_MAP = {
    "Spa": 8,
    "Pool": 30,
    "Golf": 12,
    "Gym": 20,
    "Tennis": 4,
    "Kids Club": 15,
}

_PEAK_PATTERNS = {
    "Spa": [0.3, 0.5, 0.9, 0.95, 0.85, 0.7, 0.6, 0.2],
    "Pool": [0.1, 0.4, 0.8, 0.95, 0.9, 0.7, 0.3, 0.05],
    "Golf": [0.7, 0.95, 0.85, 0.6, 0.5, 0.3, 0.1, 0.0],
    "Gym": [0.8, 0.6, 0.4, 0.3, 0.3, 0.5, 0.7, 0.4],
    "Tennis": [0.5, 0.7, 0.85, 0.6, 0.5, 0.7, 0.4, 0.1],
    "Kids Club": [0.1, 0.3, 0.7, 0.5, 0.8, 0.6, 0.3, 0.0],
}

_WEEKEND_BOOST = 0.15


def _generate_slots_for_range(
    property_id: str,
    start_date: date,
    num_days: int,
) -> list[dict]:
    """Generate slot data for every amenity across a date range."""
    slots = []
    for day_offset in range(num_days):
        current_date = start_date + timedelta(days=day_offset)
        is_weekend = current_date.weekday() >= 5

        for amenity in AMENITIES:
            capacity = _CAPACITY_MAP[amenity]
            patterns = _PEAK_PATTERNS[amenity]

            for idx, time_slot in enumerate(TIME_SLOTS):
                base_occupancy = patterns[idx]
                if is_weekend:
                    base_occupancy = min(1.0, base_occupancy + _WEEKEND_BOOST)

                booked = int(capacity * base_occupancy)
                available = capacity - booked

                slots.append(
                    {
                        "slotId": f"{property_id}-{amenity.lower()}-{current_date.isoformat()}-{idx}",
                        "propertyId": property_id,
                        "amenity": amenity,
                        "date": current_date.isoformat(),
                        "timeSlot": time_slot,
                        "capacity": capacity,
                        "booked": booked,
                        "available": available,
                        "waitlist": max(0, booked - capacity + 1) if base_occupancy >= 0.9 else 0,
                        "status": "FULL" if available <= 0 else "AVAILABLE",
                    }
                )
    return slots


def get_mock_slots(
    property_id: str = "prop-001",
    check_in: str | None = None,
    check_out: str | None = None,
) -> list[dict]:
    """Return a deep copy of generated slots for the requested property/date range."""
    if check_in and check_out:
        start = date.fromisoformat(check_in)
        end = date.fromisoformat(check_out)
        num_days = (end - start).days
        if num_days <= 0:
            num_days = 1
    else:
        start = date.today()
        num_days = 5

    return copy.deepcopy(_generate_slots_for_range(property_id, start, num_days))
