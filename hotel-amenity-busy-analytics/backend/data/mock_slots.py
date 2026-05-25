"""Database-like dummy collections for hotel amenity planning.

The app intentionally uses in-memory fixtures instead of an external database for
local development. These collections model properties, amenities/services, guests,
historical demand, and generated bookable time slots.
"""

import copy
from datetime import date, timedelta

AMENITY_COLLECTIONS = [
    {
        "id": "golf",
        "name": "Golf",
        "collection": "golf",
        "category": "Recreation",
        "service_type": "reservation",
        "description": "Championship tee times, practice facilities, and club services.",
        "capacity": 12,
    },
    {
        "id": "spa",
        "name": "Spa",
        "collection": "spa",
        "category": "Wellness",
        "service_type": "reservation",
        "description": "Treatments at the three-story spa and wellness collective.",
        "capacity": 8,
    },
    {
        "id": "fitness-center",
        "name": "Fitness Center",
        "collection": "fitnessCenter",
        "category": "Wellness",
        "service_type": "open_window",
        "description": "Fitness center access with classes, cardio equipment, and strength training.",
        "capacity": 20,
    },
    {
        "id": "pool",
        "name": "Pool",
        "collection": "pool",
        "category": "Waterpark",
        "service_type": "open_window",
        "description": "Lagoon pool, adults-only pool, cabanas, and Tidal Cove access windows.",
        "capacity": 30,
    },
    {
        "id": "free-breakfast",
        "name": "Free Breakfast",
        "collection": "freeBreakFast",
        "category": "Dining",
        "service_type": "reservation",
        "description": "Breakfast service windows for eligible guests and packages.",
        "capacity": 40,
    },
    {
        "id": "whirlpool-onsite",
        "name": "Whirlpool Onsite",
        "collection": "whirlpoolOnsite",
        "category": "Wellness",
        "service_type": "open_window",
        "description": "On-site whirlpool and relaxation area capacity planning.",
        "capacity": 10,
    },
    {
        "id": "restaurants",
        "name": "Restaurants",
        "collection": "restaurants",
        "category": "Dining",
        "service_type": "reservation",
        "description": "Signature restaurant, poolside grill, and dining room reservations.",
        "capacity": 50,
    },
    {
        "id": "lounges",
        "name": "Lounges",
        "collection": "lounges",
        "category": "Dining",
        "service_type": "reservation",
        "description": "Lobby lounge and premium seating windows.",
        "capacity": 24,
    },
    {
        "id": "ev-charging",
        "name": "EV Charging",
        "collection": "evCharging",
        "category": "Transportation",
        "service_type": "reservation",
        "description": "Electric vehicle charging appointments in the resort garage.",
        "capacity": 6,
    },
]

_AMENITY_BY_NAME = {amenity["name"]: amenity for amenity in AMENITY_COLLECTIONS}
AMENITIES = [amenity["name"] for amenity in AMENITY_COLLECTIONS]

PROPERTIES = [
    {
        "id": "prop-001",
        "name": "Residence Inn at Anaheim Resort/Convention Center",
        "location": "Anaheim, California",
        "amenity_ids": [
            "golf",
            "spa",
            "fitness-center",
            "pool",
            "free-breakfast",
            "whirlpool-onsite",
            "restaurants",
            "lounges",
            "ev-charging",
        ],
        "services": ["Digital Check In", "Mobile Key", "Service Request", "Wake-Up Calls", "Laundry", "Dry Cleaning Service", "Gift Shop"],
    },
    {
        "id": "prop-002",
        "name": "The Ritz-Carlton, New York",
        "location": "New York, New York",
        "amenity_ids": [
            "spa",
            "fitness-center",
            "free-breakfast",
            "restaurants",
            "lounges",
            "ev-charging",
        ],
        "services": ["Club Lounge", "Private Dining", "Valet", "Concierge"],
    },
    {
        "id": "prop-003",
        "name": "W Hotel, Los Angeles",
        "location": "Los Angeles, California",
        "amenity_ids": [
            "fitness-center",
            "pool",
            "restaurants",
            "lounges",
            "ev-charging",
        ],
        "services": ["Rooftop Pool", "Nightlife", "Valet", "Concierge"],
    },
]

GUESTS = {
    "guest-default": {
        "guest_id": "guest-default",
        "guest_name": "Taylor Bonvoy",
        "property_id": "prop-001",
        "check_in": date.today().isoformat(),
        "check_out": (date.today() + timedelta(days=3)).isoformat(),
        "checked_in": False,
        "plan_your_stay_enabled": False,
        "selected_amenities": [],
    }
}

TIME_SLOTS = [
    "00:00-00:30",
    "00:30-01:00",
    "01:00-01:30",
    "01:30-02:00",
    "02:00-02:30",
    "02:30-03:00",
    "03:00-03:30",
    "03:30-04:00",
    "04:00-04:30",
    "04:30-05:00",
    "05:00-05:30",
    "05:30-06:00",
    "06:00-06:30",
    "06:30-07:00",
    "07:00-07:30",
    "07:30-08:00",
    "08:00-08:30",
    "08:30-09:00",
    "09:00-09:30",
    "09:30-10:00",
    "10:00-10:30",
    "10:30-11:00",
    "11:00-11:30",
    "11:30-12:00",
    "12:00-12:30",
    "12:30-13:00",
    "13:00-13:30",
    "13:30-14:00",
    "14:00-14:30",
    "14:30-15:00",
    "15:00-15:30",
    "15:30-16:00",
    "16:00-16:30",
    "16:30-17:00",
    "17:00-17:30",
    "17:30-18:00",
    "18:00-18:30",
    "18:30-19:00",
    "19:00-19:30",
    "19:30-20:00",
    "20:00-20:30",
    "20:30-21:00",
    "21:00-21:30",
    "21:30-22:00",
    "22:00-22:30",
    "22:30-23:00",
    "23:00-23:30",
    "23:30-00:00",
]
def _expand_pattern(values: list[float]) -> list[float]:
    """Expand coarse 2-hour demand pattern into 30-minute intervals."""
    return [value for value in values for _ in range(4)]


_PEAK_PATTERNS = {
    "Golf": _expand_pattern([0.0, 0.1, 0.7, 0.95, 0.85, 0.6, 0.5, 0.3, 0.1, 0.0, 0.0, 0.0]),
    "Spa": _expand_pattern([0.0, 0.1, 0.3, 0.5, 0.9, 1.0, 0.85, 0.7, 0.6, 0.2, 0.1, 0.0]),
    "Fitness Center": _expand_pattern([0.2, 0.4, 0.8, 0.6, 0.4, 0.3, 0.3, 0.5, 0.7, 0.4, 0.2, 0.1]),
    "Pool": _expand_pattern([0.0, 0.0, 0.1, 0.4, 0.8, 1.0, 0.9, 0.7, 0.3, 0.05, 0.0, 0.0]),
    "Free Breakfast": _expand_pattern([0.0, 0.0, 0.4, 0.95, 1.0, 0.2, 0.05, 0.0, 0.0, 0.0, 0.0, 0.0]),
    "Whirlpool Onsite": _expand_pattern([0.0, 0.0, 0.1, 0.2, 0.45, 0.65, 0.75, 0.8, 0.9, 0.6, 0.3, 0.1]),
    "Restaurants": _expand_pattern([0.0, 0.0, 0.05, 0.1, 0.35, 0.65, 0.55, 0.85, 1.0, 0.9, 0.5, 0.2]),
    "Lounges": _expand_pattern([0.0, 0.0, 0.0, 0.05, 0.1, 0.25, 0.4, 0.65, 0.95, 1.0, 0.7, 0.2]),
    "EV Charging": _expand_pattern([0.2, 0.3, 0.45, 0.65, 0.7, 0.55, 0.5, 0.75, 1.0, 0.7, 0.4, 0.2]),
}

_HISTORICAL_BUSY_DATA = [
    {"day_of_week": dow, "time_index": idx, "amenity": amenity, "busy_score": min(1.0, pattern[idx] + (0.08 if dow >= 5 else 0.0))}
    for amenity, pattern in _PEAK_PATTERNS.items()
    for dow in range(7)
    for idx in range(len(TIME_SLOTS))
]

_WEEKEND_BOOST = 0.15


def get_property_amenities(property_id: str) -> list[dict]:
    """Return amenities/services enabled for a property."""
    prop = next((p for p in PROPERTIES if p["id"] == property_id), PROPERTIES[0])
    allowed = set(prop["amenity_ids"])
    return [copy.deepcopy(a) for a in AMENITY_COLLECTIONS if a["id"] in allowed]


def get_historical_busy_data() -> list[dict]:
    """Return dummy historical rows used to train the LightGBM predictor."""
    return copy.deepcopy(_HISTORICAL_BUSY_DATA)


def weather_condition_for(day: date, time_index: int, amenity_name: str) -> str:
    """Deterministic weather signal for local fallback data."""
    if day.day in {5, 12, 19, 26} and time_index in {2, 3, 4}:
        return "severe"
    if amenity_name in {"Pool", "Golf"} and time_index in {3, 4} and day.weekday() >= 5:
        return "heat"
    if day.day % 7 == 0:
        return "rain"
    return "clear"


def traffic_condition_for(day: date, time_index: int) -> str:
    """Deterministic traffic signal for local fallback data."""
    if time_index in {1, 5} and day.weekday() < 5:
        return "heavy"
    if time_index in {2, 3, 4}:
        return "moderate"
    return "light"


def _generate_slots_for_range(
    property_id: str,
    start_date: date,
    num_days: int,
) -> list[dict]:
    """Generate slot data for every property-enabled amenity across a date range."""
    slots = []
    amenities = get_property_amenities(property_id)
    for day_offset in range(num_days):
        current_date = start_date + timedelta(days=day_offset)
        is_weekend = current_date.weekday() >= 5

        for amenity in amenities:
            capacity = amenity["capacity"]
            patterns = _PEAK_PATTERNS[amenity["name"]]

            for idx, time_slot in enumerate(TIME_SLOTS):
                base_occupancy = patterns[idx]
                if is_weekend:
                    base_occupancy = min(1.0, base_occupancy + _WEEKEND_BOOST)

                booked = int(capacity * base_occupancy)
                available = capacity - booked
                waitlist_count = 2 if available <= 0 else 0

                slots.append(
                    {
                        "slotId": f"{property_id}-{amenity['id']}-{current_date.isoformat()}-{idx}",
                        "propertyId": property_id,
                        "amenityId": amenity["id"],
                        "amenity": amenity["name"],
                        "category": amenity["category"],
                        "serviceType": amenity["service_type"],
                        "date": current_date.isoformat(),
                        "timeSlot": time_slot,
                        "timeIndex": idx,
                        "capacity": capacity,
                        "booked": booked,
                        "available": available,
                        "waitlist": waitlist_count,
                        "waitlistGuests": [],
                        "reservedGuests": [],
                        "weatherCondition": weather_condition_for(current_date, idx, amenity["name"]),
                        "trafficCondition": traffic_condition_for(current_date, idx),
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
