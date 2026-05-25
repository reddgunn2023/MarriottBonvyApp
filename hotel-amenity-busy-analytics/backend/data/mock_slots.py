"""Database-like dummy collections for hotel amenity planning.

The app intentionally uses in-memory fixtures instead of an external database for
local development. These collections model properties, amenities/services, guests,
historical demand, and generated bookable time slots.
"""

import copy
from datetime import date, datetime, timedelta

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
        "service_type": "open_window",
        "description": "Free hot breakfast: Monday-Friday 6:30 AM-9:30 AM; Saturday-Sunday 7:00 AM-10:00 AM.",
        "hours": {
            "monday_friday": "6:30 AM-9:30 AM",
            "saturday_sunday": "7:00 AM-10:00 AM",
        },
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
        "id": "tennis",
        "name": "Tennis",
        "collection": "tennis",
        "category": "Recreation",
        "service_type": "reservation",
        "description": "Tennis court reservations and coaching windows.",
        "capacity": 8,
    },
    {
        "id": "cabanas",
        "name": "Cabanas",
        "collection": "cabanas",
        "category": "Pool",
        "service_type": "reservation",
        "description": "Poolside cabana reservations and day-use windows.",
        "capacity": 12,
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

OPEN_HOURS_BY_AMENITY = {
    "golf": {
        "monday_friday": "6:00 AM-6:00 PM",
        "saturday_sunday": "6:00 AM-6:00 PM",
    },
    "spa": {
        "monday_friday": "9:00 AM-8:00 PM",
        "saturday_sunday": "9:00 AM-8:00 PM",
    },
    "fitness-center": {
        "monday_friday": "5:00 AM-11:00 PM",
        "saturday_sunday": "5:00 AM-11:00 PM",
    },
    "pool": {
        "monday_friday": "7:00 AM-10:00 PM",
        "saturday_sunday": "7:00 AM-10:00 PM",
    },
    "free-breakfast": {
        "monday_friday": "6:30 AM-9:30 AM",
        "saturday_sunday": "7:00 AM-10:00 AM",
    },
    "whirlpool-onsite": {
        "monday_friday": "7:00 AM-10:00 PM",
        "saturday_sunday": "7:00 AM-10:00 PM",
    },
    "restaurants": {
        "monday_friday": "6:30 AM-11:00 PM",
        "saturday_sunday": "6:30 AM-11:00 PM",
    },
    "lounges": {
        "monday_friday": "4:00 PM-11:30 PM",
        "saturday_sunday": "4:00 PM-11:30 PM",
    },
    "tennis": {
        "monday_friday": "6:00 AM-10:00 PM",
        "saturday_sunday": "6:00 AM-10:00 PM",
    },
    "cabanas": {
        "monday_friday": "9:00 AM-6:00 PM",
        "saturday_sunday": "9:00 AM-6:00 PM",
    },
    "ev-charging": {
        "monday_friday": "12:00 AM-11:59 PM",
        "saturday_sunday": "12:00 AM-11:59 PM",
    },
}

for amenity in AMENITY_COLLECTIONS:
    amenity["openHours"] = OPEN_HOURS_BY_AMENITY[amenity["id"]]

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
            "tennis",
            "cabanas",
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
            "tennis",
            "cabanas",
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
            "tennis",
            "cabanas",
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


def _pattern_with_overrides(overrides: dict[int, float], default: float = 0.05) -> list[float]:
    """Create a 48-slot 30-minute pattern with slot-specific busy levels."""
    return [overrides.get(index, default) for index in range(len(TIME_SLOTS))]


_PEAK_PATTERNS = {
    "Golf": _expand_pattern([0.0, 0.1, 0.7, 0.95, 0.85, 0.6, 0.5, 0.3, 0.1, 0.0, 0.0, 0.0]),
    "Spa": _expand_pattern([0.0, 0.1, 0.3, 0.5, 0.9, 1.0, 0.85, 0.7, 0.6, 0.2, 0.1, 0.0]),
    "Fitness Center": _pattern_with_overrides({
        10: 0.50, 11: 0.72, 12: 0.88, 13: 0.74, 14: 0.56, 15: 0.42,
        16: 0.32, 17: 0.28, 18: 0.24, 19: 0.22, 20: 0.30, 21: 0.36,
        22: 0.44, 23: 0.52, 24: 0.48, 25: 0.40, 26: 0.35, 27: 0.33,
        28: 0.38, 29: 0.46, 30: 0.60, 31: 0.76, 32: 0.90, 33: 0.82,
        34: 0.66, 35: 0.50, 36: 0.38, 37: 0.28, 38: 0.22, 39: 0.18,
        40: 0.16, 41: 0.14, 42: 0.12, 43: 0.10, 44: 0.08, 45: 0.06,
    }, default=0.04),
    "Pool": _pattern_with_overrides({
        14: 0.18, 15: 0.24, 16: 0.34, 17: 0.46, 18: 0.58, 19: 0.70,
        20: 0.84, 21: 0.96, 22: 1.00, 23: 0.92, 24: 0.86, 25: 0.78,
        26: 0.72, 27: 0.66, 28: 0.58, 29: 0.50, 30: 0.42, 31: 0.34,
        32: 0.28, 33: 0.22, 34: 0.18, 35: 0.14, 36: 0.12, 37: 0.10,
        38: 0.08, 39: 0.07, 40: 0.06, 41: 0.05, 42: 0.04, 43: 0.03,
    }, default=0.02),
    "Free Breakfast": _pattern_with_overrides({
        13: 0.35, 14: 0.55, 15: 0.78, 16: 0.96, 17: 0.82, 18: 0.48,
        19: 0.36,
    }, default=0.02),
    "Whirlpool Onsite": _expand_pattern([0.0, 0.0, 0.1, 0.2, 0.45, 0.65, 0.75, 0.8, 0.9, 0.6, 0.3, 0.1]),
    "Restaurants": _expand_pattern([0.0, 0.0, 0.05, 0.1, 0.35, 0.65, 0.55, 0.85, 1.0, 0.9, 0.5, 0.2]),
    "Lounges": _expand_pattern([0.0, 0.0, 0.0, 0.05, 0.1, 0.25, 0.4, 0.65, 0.95, 1.0, 0.7, 0.2]),
    "Tennis": _expand_pattern([0.0, 0.0, 0.25, 0.45, 0.75, 0.85, 0.65, 0.5, 0.35, 0.15, 0.0, 0.0]),
    "Cabanas": _expand_pattern([0.0, 0.0, 0.1, 0.25, 0.55, 0.8, 1.0, 0.75, 0.45, 0.1, 0.0, 0.0]),
    "EV Charging": _expand_pattern([0.2, 0.3, 0.45, 0.65, 0.7, 0.55, 0.5, 0.75, 1.0, 0.7, 0.4, 0.2]),
}

_HISTORICAL_BUSY_DATA = [
    {"day_of_week": dow, "time_index": idx, "amenity": amenity, "busy_score": min(1.0, pattern[idx] + (0.08 if dow >= 5 else 0.0))}
    for amenity, pattern in _PEAK_PATTERNS.items()
    for dow in range(7)
    for idx in range(len(TIME_SLOTS))
]

_WEEKEND_BOOST = 0.15


def _time_to_minutes(value: str) -> int:
    """Parse either 24-hour HH:MM or display times like 6:30 AM."""
    cleaned = value.strip().upper()
    for fmt in ("%H:%M", "%I:%M %p", "%I %p"):
        try:
            parsed = datetime.strptime(cleaned, fmt)
            return parsed.hour * 60 + parsed.minute
        except ValueError:
            continue
    raise ValueError(f"Unsupported time format: {value}")


def _hours_for_date(amenity: dict, current_date: date) -> dict | None:
    hours = amenity.get("openHours") or amenity.get("hours")
    if not hours:
        return None
    if current_date.weekday() >= 5:
        window = hours.get("saturday_sunday") or hours.get("weekend")
    else:
        window = hours.get("monday_friday") or hours.get("weekday")
    if not window or "-" not in window:
        return None
    open_time, close_time = window.split("-", 1)
    return {
        "open": _time_to_minutes(open_time),
        "close": _time_to_minutes(close_time),
    }


def is_slot_open_for_amenity(slot: dict) -> bool:
    """Return whether a generated slot falls within the amenity's operating hours."""
    amenity = _AMENITY_BY_NAME.get(slot.get("amenity"))
    if not amenity:
        return True
    window = _hours_for_date(amenity, date.fromisoformat(slot["date"]))
    if not window:
        return True
    slot_start = _time_to_minutes(slot["timeSlot"].split("-", 1)[0])
    slot_end = _time_to_minutes(slot["timeSlot"].split("-", 1)[1])
    if slot_end <= slot_start:
        slot_end += 24 * 60
    return slot_start >= window["open"] and slot_end <= window["close"]


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
