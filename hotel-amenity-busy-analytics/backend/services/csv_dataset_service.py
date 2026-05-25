"""Runtime CSV datasets and event logs for amenity/service verification."""

import csv
from datetime import date, timedelta, datetime, timezone
from pathlib import Path

from data.mock_slots import AMENITY_COLLECTIONS, TIME_SLOTS
from services.score_service import calculate_busy_score, calculate_demand_score

DATASET_DIR = Path("/tmp/hotel-amenity-busy-analytics-datasets")
EVENT_LOG = DATASET_DIR / "reservation_event_log.csv"
DATASET_FIELDS = [
    "date",
    "time_slot",
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
    "message",
]


def weather_condition(day: date, time_index: int, amenity_name: str) -> str:
    """Deterministic dummy weather condition used by CSV fixtures."""
    if day.day in {5, 12, 19, 26} and time_index in {2, 3, 4}:
        return "severe"
    if amenity_name in {"Pool", "Golf"} and time_index in {3, 4} and day.weekday() >= 5:
        return "heat"
    if day.day % 7 == 0:
        return "rain"
    return "clear"


def _dataset_path(amenity_id: str) -> Path:
    return DATASET_DIR / f"{amenity_id}.csv"


def _base_rows(amenity: dict, start: date, days: int) -> list[dict]:
    rows = []
    for offset in range(days):
        current = start + timedelta(days=offset)
        for idx, time_slot in enumerate(TIME_SLOTS):
            capacity = amenity["capacity"]
            # Deterministic but varied seed occupancy for the dummy CSV database.
            occupancy = ((idx + 1) * (offset + 3) + len(amenity["id"])) % (capacity + 1)
            booked = min(capacity, occupancy)
            available = max(capacity - booked, 0)
            waitlist = 1 if available == 0 else 0
            rows.append(
                {
                    "date": current.isoformat(),
                    "time_slot": time_slot,
                    "amenity_id": amenity["id"],
                    "amenity_name": amenity["name"],
                    "category": amenity["category"],
                    "capacity": str(capacity),
                    "booked": str(booked),
                    "available": str(available),
                    "waitlist": str(waitlist),
                    "busy_score": str(calculate_busy_score(booked, capacity)),
                    "demand_score": str(calculate_demand_score(booked, capacity, waitlist)),
                    "weather_condition": weather_condition(current, idx, amenity["name"]),
                    "last_event": "seed",
                    "updated_at": "",
                }
            )
    return rows


def seed_csv_datasets(start: date | None = None, days: int = 30) -> dict:
    """Create one-month amenity/service CSV datasets if they do not exist."""
    DATASET_DIR.mkdir(parents=True, exist_ok=True)
    start = start or date.today().replace(day=1)
    created = []
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
        "dataset_dir": str(DATASET_DIR),
        "event_log": str(EVENT_LOG),
        "created": created,
        "datasets": [str(_dataset_path(amenity["id"])) for amenity in AMENITY_COLLECTIONS],
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
    """Update the matching CSV row for the event's date/time period and log it."""
    seed_csv_datasets()
    path = _dataset_path(slot["amenityId"])
    rows = _read_rows(path)
    updated_at = datetime.now(timezone.utc).isoformat()
    for row in rows:
        if row["date"] == slot["date"] and row["time_slot"] == slot["timeSlot"]:
            row["booked"] = str(slot["booked"])
            row["available"] = str(slot["available"])
            row["waitlist"] = str(slot.get("waitlist", 0))
            row["busy_score"] = str(slot.get("busyScore", calculate_busy_score(slot["booked"], slot["capacity"])))
            row["demand_score"] = str(slot.get("demandScore", calculate_demand_score(slot["booked"], slot["capacity"], slot.get("waitlist", 0))))
            row["last_event"] = event_type
            row["updated_at"] = updated_at
            break
    _write_rows(path, rows)

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
                "message": message,
            }
        )


def recent_events(limit: int = 25) -> list[dict]:
    seed_csv_datasets()
    rows = _read_rows(EVENT_LOG)
    return rows[-limit:]
