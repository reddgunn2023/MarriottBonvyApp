"""Runtime CSV datasets and event logs for amenity/service verification.

When the user-provided large CSV exists locally, it is normalized into per-amenity
CSV files. In cloud/dev environments where that absolute path is unavailable, the
service generates deterministic one-month fallback CSVs so the app remains runnable.
"""

import csv
import os
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from data.mock_slots import AMENITY_COLLECTIONS, TIME_SLOTS
from services.score_service import calculate_busy_score, calculate_demand_score

DEFAULT_SOURCE_DATASET = Path("/Users/sgunn825/Documents/hotel_amenity_large_dataset_60days.csv")
SOURCE_DATASET = Path(os.environ.get("HOTEL_AMENITY_DATASET_PATH", DEFAULT_SOURCE_DATASET))
DATASET_DIR = Path(os.environ.get("HOTEL_AMENITY_DATASET_DIR", "/tmp/hotel-amenity-busy-analytics-datasets"))
EVENT_LOG = DATASET_DIR / "reservation_event_log.csv"
DATASET_FIELDS = [
    "date",
    "time_slot",
    "property_id",
    "amenity_id",
    "amenity_name",
    "category",
    "capacity",
    "booked",
    "available",
    "waitlist",
    "busy_score",
    "demand_score",
    "weather_condition",
    "traffic_condition",
    "weather_score",
    "traffic_score",
    "forecast_score",
    "last_event",
    "updated_at",
]
EVENT_FIELDS = [
    "timestamp",
    "event_type",
    "property_id",
    "guest_id",
    "slot_id",
    "amenity_id",
    "amenity_name",
    "date",
    "time_slot",
    "booked",
    "available",
    "waitlist",
    "busy_score",
    "demand_score",
    "weather_condition",
    "traffic_condition",
    "forecast_score",
    "message",
]


def _norm_key(key: str) -> str:
    return key.strip().lower().replace(" ", "_").replace("-", "_")


def _get(row: dict, *aliases: str, default: str = "") -> str:
    normalized = {_norm_key(k): v for k, v in row.items()}
    for alias in aliases:
        value = normalized.get(_norm_key(alias))
        if value not in (None, ""):
            return str(value).strip()
    return default


def _safe_int(value: str, default: int = 0) -> int:
    try:
        return int(float(str(value).strip()))
    except (TypeError, ValueError):
        return default


def _slug(value: str) -> str:
    return value.strip().lower().replace("&", "and").replace(" ", "-")


def weather_score(condition: str) -> float:
    value = condition.strip().lower()
    if value in {"severe", "storm", "hurricane", "extreme"}:
        return 1.0
    if value in {"rain", "heat", "snow", "wind", "hot"}:
        return 0.65
    if value in {"cloudy", "overcast", "moderate"}:
        return 0.35
    return 0.1


def traffic_score(condition: str) -> float:
    value = condition.strip().lower()
    if value in {"severe", "heavy", "high", "congested"}:
        return 1.0
    if value in {"moderate", "medium"}:
        return 0.55
    if value in {"light", "low"}:
        return 0.15
    return 0.25


def forecast_score(busy: float, demand: float, weather: float, traffic: float) -> float:
    return round(min(1.0, busy * 0.52 + min(demand, 1.5) * 0.24 + weather * 0.12 + traffic * 0.12), 2)


def weather_condition(day: date, time_index: int, amenity_name: str) -> str:
    """Deterministic dummy weather condition used by fallback CSV fixtures."""
    if day.day in {5, 12, 19, 26} and time_index in {2, 3, 4}:
        return "severe"
    if amenity_name in {"Pool", "Golf"} and time_index in {3, 4} and day.weekday() >= 5:
        return "heat"
    if day.day % 7 == 0:
        return "rain"
    return "clear"


def traffic_condition(day: date, time_index: int) -> str:
    if time_index in {1, 5} and day.weekday() < 5:
        return "heavy"
    if time_index in {2, 3, 4}:
        return "moderate"
    return "light"


def _dataset_path(amenity_id: str) -> Path:
    return DATASET_DIR / f"{amenity_id}.csv"


def _row_with_scores(row: dict) -> dict:
    capacity = max(_safe_int(row.get("capacity", 0)), 1)
    booked = min(_safe_int(row.get("booked", 0)), capacity)
    waitlist = max(_safe_int(row.get("waitlist", 0)), 0)
    available = max(_safe_int(row.get("available", capacity - booked), capacity - booked), 0)
    busy = calculate_busy_score(booked, capacity)
    demand = calculate_demand_score(booked, capacity, waitlist)
    w_score = weather_score(row.get("weather_condition", "clear"))
    t_score = traffic_score(row.get("traffic_condition", "light"))
    return {
        **row,
        "capacity": str(capacity),
        "booked": str(booked),
        "available": str(available),
        "waitlist": str(waitlist),
        "busy_score": str(busy),
        "demand_score": str(demand),
        "weather_score": str(w_score),
        "traffic_score": str(t_score),
        "forecast_score": str(forecast_score(busy, demand, w_score, t_score)),
    }


def _base_rows(amenity: dict, start: date, days: int) -> list[dict]:
    rows = []
    for offset in range(days):
        current = start + timedelta(days=offset)
        for idx, time_slot in enumerate(TIME_SLOTS):
            capacity = amenity["capacity"]
            occupancy = ((idx + 1) * (offset + 3) + len(amenity["id"])) % (capacity + 1)
            booked = min(capacity, occupancy)
            available = max(capacity - booked, 0)
            waitlist = 1 if available == 0 else 0
            rows.append(
                _row_with_scores(
                    {
                        "date": current.isoformat(),
                        "time_slot": time_slot,
                        "property_id": "prop-001",
                        "amenity_id": amenity["id"],
                        "amenity_name": amenity["name"],
                        "category": amenity["category"],
                        "capacity": str(capacity),
                        "booked": str(booked),
                        "available": str(available),
                        "waitlist": str(waitlist),
                        "weather_condition": weather_condition(current, idx, amenity["name"]),
                        "traffic_condition": traffic_condition(current, idx),
                        "last_event": "seed",
                        "updated_at": "",
                    }
                )
            )
    return rows


def _normalize_source_row(row: dict) -> dict | None:
    amenity_name = _get(row, "amenity_name", "amenity", "service", "service_name", "amenity_type")
    if not amenity_name:
        return None
    amenity = next((item for item in AMENITY_COLLECTIONS if item["name"].lower() == amenity_name.lower()), None)
    amenity_id = _get(row, "amenity_id", "service_id", default=amenity["id"] if amenity else _slug(amenity_name))
    category = _get(row, "category", default=amenity["category"] if amenity else "Service")
    capacity_default = amenity["capacity"] if amenity else 10
    capacity = _safe_int(_get(row, "capacity", "max_capacity", "total_capacity", default=str(capacity_default)), capacity_default)
    booked = _safe_int(_get(row, "booked", "reserved", "reservations", "current_occupancy", "occupied", default="0"), 0)
    waitlist = _safe_int(_get(row, "waitlist", "waiting", "waiting_count", "waiting_line", default="0"), 0)
    available = _safe_int(_get(row, "available", "open", "remaining", default=str(max(capacity - booked, 0))), max(capacity - booked, 0))
    date_value = _get(row, "date", "slot_date", "stay_date", default=date.today().isoformat())
    time_slot = _get(row, "time_slot", "time", "slot", "period", default=TIME_SLOTS[0])
    return _row_with_scores(
        {
            "date": date_value,
            "time_slot": time_slot,
            "property_id": _get(row, "property_id", "property", "hotel_id", default="prop-001"),
            "amenity_id": amenity_id,
            "amenity_name": amenity_name,
            "category": category,
            "capacity": str(capacity),
            "booked": str(booked),
            "available": str(available),
            "waitlist": str(waitlist),
            "weather_condition": _get(row, "weather_condition", "weather", default="clear"),
            "traffic_condition": _get(row, "traffic_condition", "traffic", default="light"),
            "last_event": _get(row, "last_event", default="source"),
            "updated_at": _get(row, "updated_at", default=""),
        }
    )


def _seed_from_source() -> list[str]:
    if not SOURCE_DATASET.exists():
        return []
    grouped: dict[str, list[dict]] = {}
    with SOURCE_DATASET.open(newline="") as handle:
        for row in csv.DictReader(handle):
            normalized = _normalize_source_row(row)
            if normalized:
                grouped.setdefault(normalized["amenity_id"], []).append(normalized)
    created = []
    for amenity_id, rows in grouped.items():
        path = _dataset_path(amenity_id)
        with path.open("w", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=DATASET_FIELDS)
            writer.writeheader()
            writer.writerows(rows)
        created.append(str(path))
    return created


def seed_csv_datasets(start: date | None = None, days: int = 30) -> dict:
    """Create per-amenity CSV datasets if they do not exist."""
    DATASET_DIR.mkdir(parents=True, exist_ok=True)
    created = []
    source_used = False
    if SOURCE_DATASET.exists() and not any(DATASET_DIR.glob("*.csv")):
        created.extend(_seed_from_source())
        source_used = True

    start = start or date.today().replace(day=1)
    for amenity in AMENITY_COLLECTIONS:
        path = _dataset_path(amenity["id"])
        if not path.exists():
            with path.open("w", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=DATASET_FIELDS)
                writer.writeheader()
                writer.writerows(_base_rows(amenity, start, days))
            created.append(str(path))

    if not EVENT_LOG.exists():
        with EVENT_LOG.open("w", newline="") as handle:
            csv.DictWriter(handle, fieldnames=EVENT_FIELDS).writeheader()

    return {
        "source_dataset": str(SOURCE_DATASET),
        "source_dataset_found": SOURCE_DATASET.exists(),
        "source_dataset_used": source_used,
        "dataset_dir": str(DATASET_DIR),
        "event_log": str(EVENT_LOG),
        "created": created,
        "datasets": [str(path) for path in sorted(DATASET_DIR.glob("*.csv")) if path.name != EVENT_LOG.name],
    }


def _read_rows(path: Path) -> list[dict]:
    with path.open(newline="") as handle:
        return list(csv.DictReader(handle))


def _write_rows(path: Path, rows: list[dict]) -> None:
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=DATASET_FIELDS)
        writer.writeheader()
        writer.writerows(rows)


def update_dataset_for_event(slot: dict, event_type: str, guest_id: str, message: str) -> None:
    """Update the matching CSV row for the event's property/date/time period and log it."""
    seed_csv_datasets()
    path = _dataset_path(slot["amenityId"])
    rows = _read_rows(path)
    updated_at = datetime.now(timezone.utc).isoformat()
    matched = False
    for row in rows:
        same_period = row["date"] == slot["date"] and row["time_slot"] == slot["timeSlot"]
        same_property = row.get("property_id", slot["propertyId"]) == slot["propertyId"]
        if same_period and same_property:
            row.update(
                _row_with_scores(
                    {
                        **row,
                        "booked": str(slot["booked"]),
                        "available": str(slot["available"]),
                        "waitlist": str(slot.get("waitlist", 0)),
                        "weather_condition": slot.get("weatherCondition", row.get("weather_condition", "clear")),
                        "traffic_condition": slot.get("trafficCondition", row.get("traffic_condition", "light")),
                        "last_event": event_type,
                        "updated_at": updated_at,
                    }
                )
            )
            matched = True
            break
    if not matched:
        rows.append(
            _row_with_scores(
                {
                    "date": slot["date"],
                    "time_slot": slot["timeSlot"],
                    "property_id": slot["propertyId"],
                    "amenity_id": slot["amenityId"],
                    "amenity_name": slot["amenity"],
                    "category": slot.get("category", "Service"),
                    "capacity": str(slot["capacity"]),
                    "booked": str(slot["booked"]),
                    "available": str(slot["available"]),
                    "waitlist": str(slot.get("waitlist", 0)),
                    "weather_condition": slot.get("weatherCondition", "clear"),
                    "traffic_condition": slot.get("trafficCondition", "light"),
                    "last_event": event_type,
                    "updated_at": updated_at,
                }
            )
        )
    _write_rows(path, rows)

    event_row_base = _row_with_scores(
        {
            "capacity": str(slot["capacity"]),
            "booked": str(slot["booked"]),
            "available": str(slot["available"]),
            "waitlist": str(slot.get("waitlist", 0)),
            "weather_condition": slot.get("weatherCondition", "clear"),
            "traffic_condition": slot.get("trafficCondition", "light"),
        }
    )
    with EVENT_LOG.open("a", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=EVENT_FIELDS)
        writer.writerow(
            {
                "timestamp": updated_at,
                "event_type": event_type,
                "property_id": slot["propertyId"],
                "guest_id": guest_id,
                "slot_id": slot["slotId"],
                "amenity_id": slot["amenityId"],
                "amenity_name": slot["amenity"],
                "date": slot["date"],
                "time_slot": slot["timeSlot"],
                "booked": slot["booked"],
                "available": slot["available"],
                "waitlist": slot.get("waitlist", 0),
                "busy_score": event_row_base["busy_score"],
                "demand_score": event_row_base["demand_score"],
                "weather_condition": event_row_base["weather_condition"],
                "traffic_condition": event_row_base["traffic_condition"],
                "forecast_score": event_row_base["forecast_score"],
                "message": message,
            }
        )


def recent_events(limit: int = 25) -> list[dict]:
    seed_csv_datasets()
    rows = _read_rows(EVENT_LOG)
    return rows[-limit:]
