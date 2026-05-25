"""Guest check-in, consent, and schedule state for the mock API."""

from data.mock_slots import GUESTS, get_property_amenities


def check_in_guest(
    guest_id: str,
    guest_name: str,
    property_id: str,
    check_in: str,
    check_out: str,
) -> dict:
    """Mark a guest checked into a property for a stay window."""
    guest = GUESTS.get(guest_id, {})
    guest.update(
        {
            "guest_id": guest_id,
            "guest_name": guest_name,
            "property_id": property_id,
            "check_in": check_in,
            "check_out": check_out,
            "checked_in": True,
            "plan_your_stay_enabled": guest.get("plan_your_stay_enabled", False),
            "selected_amenities": guest.get("selected_amenities", []),
        }
    )
    GUESTS[guest_id] = guest
    return guest


def save_guest_consent(
    guest_id: str,
    property_id: str,
    plan_your_stay_enabled: bool,
    selected_amenities: list[str],
) -> dict:
    """Persist plan-your-stay consent and amenity filters."""
    guest = GUESTS.setdefault(
        guest_id,
        {
            "guest_id": guest_id,
            "guest_name": "Taylor Bonvoy",
            "property_id": property_id,
            "check_in": "",
            "check_out": "",
            "checked_in": False,
            "plan_your_stay_enabled": False,
            "selected_amenities": [],
        },
    )
    if not selected_amenities:
        selected_amenities = [amenity["name"] for amenity in get_property_amenities(property_id)]
    guest["property_id"] = property_id
    guest["plan_your_stay_enabled"] = plan_your_stay_enabled
    guest["selected_amenities"] = selected_amenities
    return guest


def get_guest(guest_id: str) -> dict:
    """Return a guest profile, creating a default profile when needed."""
    return GUESTS.setdefault(
        guest_id,
        {
            "guest_id": guest_id,
            "guest_name": "Taylor Bonvoy",
            "property_id": "prop-001",
            "check_in": "",
            "check_out": "",
            "checked_in": False,
            "plan_your_stay_enabled": False,
            "selected_amenities": [],
        },
    )
