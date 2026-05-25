"""Reserve, cancel, waitlist, and guest schedule logic for amenity slots."""

from data.mock_slots import get_mock_slots
from services.csv_dataset_service import update_dataset_for_event
from services.score_service import recalculate_slot_scores

_active_slots: dict[str, list[dict]] = {}
_loaded_ranges: dict[str, tuple[str, str]] = {}
_guest_schedules: dict[str, list[dict]] = {}


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


def get_guest_schedule(guest_id: str) -> list[dict]:
    """Return the current guest-specific schedule."""
    return _guest_schedules.get(guest_id, [])


def _find_slot(property_id: str, slot_id: str) -> dict | None:
    slots = _active_slots.get(property_id, [])
    for slot in slots:
        if slot["slotId"] == slot_id:
            return slot
    return None


def _schedule_item(slot: dict) -> dict:
    return {
        "slot_id": slot["slotId"],
        "property_id": slot["propertyId"],
        "amenity": slot["amenity"],
        "amenity_id": slot["amenityId"],
        "date": slot["date"],
        "time_slot": slot["timeSlot"],
        "status": "RESERVED",
    }


def _find_conflict(guest_id: str, slot: dict) -> dict | None:
    for item in _guest_schedules.get(guest_id, []):
        same_time = item["date"] == slot["date"] and item["time_slot"] == slot["timeSlot"]
        if same_time and item["slot_id"] != slot["slotId"]:
            return item
        if item["slot_id"] == slot["slotId"]:
            return item
    return None


def _slot_result(
    slot: dict,
    success: bool,
    message: str,
    event_type: str,
    guest_id: str | None = None,
    log_event: bool = False,
    **extra,
) -> dict:
    recalculate_slot_scores(slot)
    if log_event and guest_id:
        update_dataset_for_event(slot, event_type, guest_id, message)
    return {
        "success": success,
        "message": message,
        "slot_id": slot["slotId"],
        "event_type": event_type,
        "updated_available": slot["available"],
        "updated_booked": slot["booked"],
        "waitlist_count": slot["waitlist"],
        **extra,
    }


def reserve(property_id: str, slot_id: str, guest_id: str = "guest-default") -> dict:
    """Attempt to reserve one seat in the given slot for the guest."""
    slot = _find_slot(property_id, slot_id)
    if slot is None:
        return {"success": False, "message": "Slot not found"}

    conflict = _find_conflict(guest_id, slot)
    if conflict:
        if conflict["slot_id"] == slot_id:
            message = "This guest already reserved the selected slot"
        else:
            message = f"Schedule conflict with {conflict['amenity']} at {conflict['time_slot']}"
        return _slot_result(
            slot,
            False,
            message,
            "RESERVE",
            conflict_slot_id=conflict["slot_id"],
            conflict_amenity=conflict["amenity"],
            conflict_time_slot=conflict["time_slot"],
        )

    if slot["available"] <= 0:
        return _slot_result(slot, False, "No availability - join the waiting list", "RESERVE")

    slot["booked"] += 1
    slot["available"] -= 1
    slot.setdefault("reservedGuests", []).append(guest_id)
    if slot["available"] <= 0:
        slot["status"] = "FULL"

    _guest_schedules.setdefault(guest_id, []).append(_schedule_item(slot))

    return _slot_result(
        slot,
        True,
        "Reservation confirmed",
        "RESERVE",
        guest_id=guest_id,
        log_event=True,
    )


def cancel(property_id: str, slot_id: str, guest_id: str = "guest-default") -> dict:
    """Cancel one guest reservation and promote the first waitlisted guest."""
    slot = _find_slot(property_id, slot_id)
    if slot is None:
        return {"success": False, "message": "Slot not found"}

    guest_schedule = _guest_schedules.get(guest_id, [])
    matching = [item for item in guest_schedule if item["slot_id"] == slot_id]
    if not matching:
        return _slot_result(slot, False, "No reservation found for this guest", "CANCEL")

    _guest_schedules[guest_id] = [item for item in guest_schedule if item["slot_id"] != slot_id]
    if guest_id in slot.get("reservedGuests", []):
        slot["reservedGuests"].remove(guest_id)
    slot["booked"] = max(slot["booked"] - 1, 0)
    slot["available"] += 1
    slot["status"] = "AVAILABLE"

    waitlist_guests = slot.setdefault("waitlistGuests", [])
    if waitlist_guests:
        promoted_guest = waitlist_guests.pop(0)
        slot["waitlist"] = max(slot["waitlist"] - 1, 0)
        slot["booked"] += 1
        slot["available"] -= 1
        slot.setdefault("reservedGuests", []).append(promoted_guest)
        _guest_schedules.setdefault(promoted_guest, []).append(_schedule_item(slot))
        if slot["available"] <= 0:
            slot["status"] = "FULL"

    return _slot_result(
        slot,
        True,
        "Reservation cancelled",
        "CANCEL",
        guest_id=guest_id,
        log_event=True,
    )


def waitlist(property_id: str, slot_id: str, guest_id: str = "guest-default") -> dict:
    """Add one guest to the waitlist for a full slot."""
    slot = _find_slot(property_id, slot_id)
    if slot is None:
        return {"success": False, "message": "Slot not found"}

    if guest_id in slot.get("waitlistGuests", []):
        position = slot["waitlistGuests"].index(guest_id) + 1
        return _slot_result(
            slot,
            False,
            f"Already on waiting list at position {position}",
            "WAITLIST",
            waitlist_position=position,
        )

    slot.setdefault("waitlistGuests", []).append(guest_id)
    slot["waitlist"] += 1
    position = len(slot["waitlistGuests"])

    return _slot_result(
        slot,
        True,
        f"Added to waiting list at position {position}",
        "WAITLIST",
        waitlist_position=position,
        guest_id=guest_id,
        log_event=True,
    )


def reload_slots(
    property_id: str,
    check_in: str,
    check_out: str,
) -> list[dict]:
    """Force-reload slots when the date range changes."""
    _active_slots[property_id] = get_mock_slots(property_id, check_in, check_out)
    _loaded_ranges[property_id] = (check_in, check_out)
    return _active_slots[property_id]
