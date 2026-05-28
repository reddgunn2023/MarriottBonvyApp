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
        "name": "On-Site Bar",
        "collection": "onsiteBar",
        "category": "Dining",
        "service_type": "reservation",
        "description": "On-site bar seating windows and evening drink service.",
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
        "id": "business-center",
        "name": "Business Center",
        "collection": "businessCenter",
        "category": "Business",
        "service_type": "open_window",
        "description": "Business center access for printing, workstations, and productivity needs.",
        "capacity": 10,
    },
    {
        "id": "meeting-space",
        "name": "Meeting Space",
        "collection": "meetingSpace",
        "category": "Business",
        "service_type": "reservation",
        "description": "Small meeting room availability for groups and event planning.",
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
        "monday_friday": "6:00 AM-10:00 PM",
        "saturday_sunday": "6:00 AM-10:00 PM",
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
        "monday_friday": "6:30 AM-9:30 AM",
        "saturday_sunday": "7:00 AM-10:00 AM",
    },
    "lounges": {
        "monday_friday": "5:00 PM-10:00 PM",
        "saturday_sunday": "5:00 PM-10:00 PM",
    },
    "tennis": {
        "monday_friday": "6:00 AM-10:00 PM",
        "saturday_sunday": "6:00 AM-10:00 PM",
    },
    "cabanas": {
        "monday_friday": "9:00 AM-6:00 PM",
        "saturday_sunday": "9:00 AM-6:00 PM",
    },
    "business-center": {
        "monday_friday": "7:00 AM-10:00 PM",
        "saturday_sunday": "7:00 AM-10:00 PM",
    },
    "meeting-space": {
        "monday_friday": "8:00 AM-8:00 PM",
        "saturday_sunday": "8:00 AM-8:00 PM",
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
            "business-center",
            "meeting-space",
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
            "business-center",
            "meeting-space",
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
            "business-center",
            "meeting-space",
            "ev-charging",
        ],
        "services": ["Rooftop Pool", "Nightlife", "Valet", "Concierge"],
    },
]

GUESTS = {
    "guest-default": {
        "guest_id": "guest-default",
        "guest_name": "Srikar Reddy",
        "property_id": "prop-001",
        "check_in": "2026-07-01",
        "check_out": "2026-07-08",
        "checked_in": False,
        "plan_your_stay_enabled": False,
        "selected_amenities": [],
    },
    "july-guest": {
        "guest_id": "july-guest",
        "guest_name": "Srikar Reddy",
        "property_id": "prop-001",
        "check_in": "2026-07-01",
        "check_out": "2026-07-08",
        "checked_in": False,
        "plan_your_stay_enabled": False,
        "selected_amenities": ["Free Breakfast", "Pool", "Fitness Center", "On-Site Bar"],
    },
}

TIME_SLOTS = [
    "00:00-01:00",
    "01:00-02:00",
    "02:00-03:00",
    "03:00-04:00",
    "04:00-05:00",
    "05:00-06:00",
    "06:00-07:00",
    "07:00-08:00",
    "08:00-09:00",
    "09:00-10:00",
    "10:00-11:00",
    "11:00-12:00",
    "12:00-13:00",
    "13:00-14:00",
    "14:00-15:00",
    "15:00-16:00",
    "16:00-17:00",
    "17:00-18:00",
    "18:00-19:00",
    "19:00-20:00",
    "20:00-21:00",
    "21:00-22:00",
    "22:00-23:00",
    "23:00-00:00",
]
def _expand_pattern(values: list[float]) -> list[float]:
    """Return hourly demand pattern values."""
    return values


def _pattern_with_overrides(overrides: dict[int, float], default: float = 0.05) -> list[float]:
    """Create a 24-slot hourly pattern with slot-specific busy levels."""
    return [overrides.get(index, default) for index in range(len(TIME_SLOTS))]


_PEAK_PATTERNS = {
    "Golf": _expand_pattern([0.0, 0.1, 0.7, 0.95, 0.85, 0.6, 0.5, 0.3, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
    "Spa": _expand_pattern([0.0, 0.1, 0.3, 0.5, 0.9, 1.0, 0.85, 0.7, 0.6, 0.2, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
    "Fitness Center": _pattern_with_overrides({6: 0.68, 7: 0.52, 8: 0.34, 9: 0.24, 10: 0.30, 11: 0.44, 12: 0.48, 13: 0.35, 14: 0.38, 15: 0.60, 16: 0.86, 17: 0.74, 18: 0.55, 19: 0.36, 20: 0.20, 21: 0.12}, default=0.04),
    "Pool": _pattern_with_overrides({7: 0.22, 8: 0.40, 9: 0.64, 10: 0.88, 11: 1.0, 12: 0.92, 13: 0.78, 14: 0.62, 15: 0.48, 16: 0.32, 17: 0.18, 18: 0.10, 19: 0.08, 20: 0.05, 21: 0.04}, default=0.02),
    "Free Breakfast": _pattern_with_overrides({6: 0.42, 7: 0.82, 8: 0.96, 9: 0.48}, default=0.02),
    "Whirlpool Onsite": _expand_pattern([0.0, 0.0, 0.1, 0.2, 0.45, 0.65, 0.75, 0.8, 0.9, 0.6, 0.3, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
    "Restaurants": _expand_pattern([0.0, 0.0, 0.05, 0.1, 0.35, 0.65, 0.55, 0.85, 1.0, 0.9, 0.5, 0.2, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
    "On-Site Bar": _expand_pattern([0.0, 0.0, 0.0, 0.05, 0.1, 0.25, 0.4, 0.65, 0.95, 1.0, 0.7, 0.2, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
    "Tennis": _expand_pattern([0.0, 0.0, 0.25, 0.45, 0.75, 0.85, 0.65, 0.5, 0.35, 0.15, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
    "Cabanas": _expand_pattern([0.0, 0.0, 0.1, 0.25, 0.55, 0.8, 1.0, 0.75, 0.45, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
    "Business Center": _pattern_with_overrides({7: 0.25, 8: 0.45, 9: 0.62, 10: 0.54, 11: 0.38, 12: 0.30, 13: 0.42, 14: 0.58, 15: 0.64, 16: 0.48, 17: 0.30, 18: 0.18, 19: 0.12, 20: 0.08, 21: 0.05}, default=0.02),
    "Meeting Space": _pattern_with_overrides({8: 0.35, 9: 0.70, 10: 0.82, 11: 0.56, 12: 0.30, 13: 0.40, 14: 0.74, 15: 0.88, 16: 0.66, 17: 0.32, 18: 0.18, 19: 0.08}, default=0.02),
    "EV Charging": _expand_pattern([0.2, 0.3, 0.45, 0.65, 0.7, 0.55, 0.5, 0.75, 1.0, 0.7, 0.4, 0.2, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
}

_HISTORICAL_BUSY_DATA = [
    {"day_of_week": dow, "time_index": idx, "amenity": amenity, "busy_score": min(1.0, pattern[idx] + (0.08 if dow >= 5 else 0.0))}
    for amenity, pattern in _PEAK_PATTERNS.items()
    for dow in range(7)
    for idx in range(len(TIME_SLOTS))
]

_WEEKEND_BOOST = 0.15
OUTDOOR_AMENITY_IDS = {"pool", "golf", "tennis", "cabanas", "whirlpool-onsite"}
INDOOR_DEMAND_BOOST = 0.18


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
    # Hourly analytics should include slots that overlap the amenity window,
    # e.g. 06:00-07:00 overlaps breakfast opening at 6:30 AM.
    return slot_start < window["close"] and slot_end > window["open"]


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
    if is_severe_weather_window(day, time_index):
        return "severe"
    if season_for(day) == "summer" and amenity_name in {"Pool", "Golf", "Tennis", "Cabanas"} and 11 <= time_index <= 16:
        return "heat"
    if day.day % 7 == 0:
        return "rain"
    return "clear"


def traffic_condition_for(day: date, time_index: int) -> str:
    """Deterministic traffic signal for local fallback data."""
    if time_index in {1, 5} and day.weekday() < 5:
        return "heavy"
    if time_index in {1, 2}:
        return "moderate"
    return "light"


def season_for(day: date) -> str:
    if day.month in {12, 1, 2}:
        return "winter"
    if day.month in {3, 4, 5}:
        return "spring"
    if day.month in {6, 7, 8}:
        return "summer"
    return "fall"


def is_severe_weather_window(day: date, time_index: int) -> bool:
    """Deterministic severe weather windows used to exercise weather impacts."""
    # Summer afternoon storm window for the July guest scenario.
    if day.month == 7 and day.day in {3, 4} and 12 <= time_index <= 15:
        return True
    # Existing occasional early-morning severe events for mock variability.
    return day.day in {5, 12, 19, 26} and time_index in {1, 2}


def _historical_variance(current_date: date, time_index: int, amenity_id: str) -> float:
    """Small deterministic variance so historical mock rows are not identical."""
    seed = (current_date.toordinal() + time_index * 7 + len(amenity_id) * 13) % 9
    return (seed - 4) * 0.025


def seasonal_event_for(day: date) -> dict | None:
    """Deterministic seasonal event metadata for mock scenarios."""
    if day.month == 7 and day.day == 4:
        return {
            "name": "Independence Day holiday",
            "impact": "Holiday demand is elevated; outdoor plans may be affected by afternoon storms.",
        }
    if day.month == 7 and day.day in {1, 2, 3, 5, 6, 7}:
        return {
            "name": "Summer travel week",
            "impact": "Summer family travel increases demand for pool and indoor amenities.",
        }
    return None


def _generate_slots_for_range(
    property_id: str,
    start_date: date,
    num_days: int,
    historical: bool = False,
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
                if historical:
                    base_occupancy = max(0.0, min(1.0, base_occupancy + _historical_variance(current_date, idx, amenity["id"])))

                weather_condition = weather_condition_for(current_date, idx, amenity["name"])
                traffic_condition = traffic_condition_for(current_date, idx)
                seasonal_event = seasonal_event_for(current_date)
                weather_blocked = weather_condition == "severe" and amenity["id"] in OUTDOOR_AMENITY_IDS
                indoor_weather_boost = weather_condition == "severe" and amenity["id"] not in OUTDOOR_AMENITY_IDS
                if indoor_weather_boost:
                    base_occupancy = min(1.0, base_occupancy + INDOOR_DEMAND_BOOST)

                booked = 0 if weather_blocked else int(capacity * base_occupancy)
                available = 0 if weather_blocked else capacity - booked
                waitlist_count = 0 if weather_blocked else (2 if available <= 0 else 0)
                status = "WEATHER_BLOCKED" if weather_blocked else ("FULL" if available <= 0 else "AVAILABLE")

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
                        "season": season_for(current_date),
                        "seasonalEvent": seasonal_event["name"] if seasonal_event else None,
                        "seasonalEventImpact": seasonal_event["impact"] if seasonal_event else None,
                        "weatherCondition": weather_condition,
                        "weatherSeverity": 1.0 if weather_condition == "severe" else (0.65 if weather_condition in {"heat", "rain"} else 0.1),
                        "weatherBlocked": weather_blocked,
                        "indoorWeatherBoost": indoor_weather_boost,
                        "trafficCondition": traffic_condition,
                        "status": status,
                        "historical": historical,
                    }
                )
    return slots


def get_mock_historical_slots(
    property_id: str = "prop-001",
    days: int = 90,
    anchor_date: date | None = None,
) -> list[dict]:
    """Return 90 days of historical mock slots ending before anchor_date."""
    anchor = anchor_date or date.today()
    start = anchor - timedelta(days=days)
    return copy.deepcopy(_generate_slots_for_range(property_id, start, days, historical=True))


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
        num_days = 30

    return copy.deepcopy(_generate_slots_for_range(property_id, start, num_days))
