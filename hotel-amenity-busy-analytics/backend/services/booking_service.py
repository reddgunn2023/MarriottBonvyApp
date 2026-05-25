"""Reserve, cancel, and waitlist logic for amenity slots."""

from data.mock_slots import get_mock_slots

_active_slots: dict[str, list[dict]] = {}
_loaded_ranges: dict[str, tuple[str, str]] = {}


def _ensure_loaded(property_id: str, check_in: str, check_out: str) -> list[dict]:
    """Lazily load slots for a property into the in-memory store."""
    if property_id not in _active_slots:
        _active_slots[property_id] = get_mock_slots(property_id, check_in, check_out)
        _loaded_ranges[property_id] = (check_in, check_out)
    return _active_slots[property_id]


def ensure_loaded_for_range(
    property_id: str,
    check_in: str,
    check_out: str,
) -> list[dict]:
    """Load slots only if not already loaded or if the date range changed."""
    current = _loaded_ranges.get(property_id)
    if current and current == (check_in, check_out) and property_id in _active_slots:
        return _active_slots[property_id]
    return reload_slots(property_id, check_in, check_out)


def get_all_slots(
    property_id: str,
    check_in: str | None = None,
    check_out: str | None = None,
) -> list[dict]:
    """Return all current slots for a property."""
    if property_id in _active_slots:
        return _active_slots[property_id]
    return _ensure_loaded(property_id, check_in or "", check_out or "")


def _find_slot(property_id: str, slot_id: str) -> dict | None:
    slots = _active_slots.get(property_id, [])
    for slot in slots:
        if slot["slotId"] == slot_id:
            return slot
    return None


def reserve(property_id: str, slot_id: str) -> dict:
    """Attempt to reserve one seat in the given slot."""
    slot = _find_slot(property_id, slot_id)
    if slot is None:
        return {"success": False, "message": "Slot not found"}

    if slot["available"] <= 0:
        return {
            "success": False,
            "message": "No availability — consider joining the waitlist",
        }

    slot["booked"] += 1
    slot["available"] -= 1
    if slot["available"] <= 0:
        slot["status"] = "FULL"

    return {
        "success": True,
        "message": "Reservation confirmed",
        "slot_id": slot_id,
        "event_type": "RESERVE",
        "updated_available": slot["available"],
        "updated_booked": slot["booked"],
        "waitlist_count": slot["waitlist"],
    }


def cancel(property_id: str, slot_id: str) -> dict:
    """Cancel one seat reservation."""
    slot = _find_slot(property_id, slot_id)
    if slot is None:
        return {"success": False, "message": "Slot not found"}

    if slot["booked"] <= 0:
        return {"success": False, "message": "No bookings to cancel"}

    slot["booked"] -= 1
    slot["available"] += 1
    slot["status"] = "AVAILABLE"

    if slot["waitlist"] > 0:
        slot["waitlist"] -= 1
        slot["booked"] += 1
        slot["available"] -= 1
        if slot["available"] <= 0:
            slot["status"] = "FULL"

    return {
        "success": True,
        "message": "Reservation cancelled",
        "slot_id": slot_id,
        "event_type": "CANCEL",
        "updated_available": slot["available"],
        "updated_booked": slot["booked"],
        "waitlist_count": slot["waitlist"],
    }


def waitlist(property_id: str, slot_id: str) -> dict:
    """Add one guest to the waitlist for the given slot."""
    slot = _find_slot(property_id, slot_id)
    if slot is None:
        return {"success": False, "message": "Slot not found"}

    slot["waitlist"] += 1

    return {
        "success": True,
        "message": "Added to waitlist",
        "slot_id": slot_id,
        "event_type": "WAITLIST",
        "updated_available": slot["available"],
        "updated_booked": slot["booked"],
        "waitlist_count": slot["waitlist"],
    }


def reload_slots(
    property_id: str,
    check_in: str,
    check_out: str,
) -> list[dict]:
    """Force-reload slots (useful after date-range change)."""
    _active_slots[property_id] = get_mock_slots(property_id, check_in, check_out)
    _loaded_ranges[property_id] = (check_in, check_out)
    return _active_slots[property_id]
