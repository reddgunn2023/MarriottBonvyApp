"""FastAPI application - Hotel Amenity Busy Analytics API."""

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from models import (
    BusyAnalyticsRequest,
    BusyAnalyticsResponse,
    ConsentRequest,
    EventRequest,
    EventResponse,
    GuestCheckInRequest,
    GuestResponse,
    RecommendationRequest,
    RecommendationResponse,
    SlotScore,
    Recommendation,
)
from data.mock_slots import AMENITIES, AMENITY_COLLECTIONS, PROPERTIES, get_property_amenities
from services.booking_service import (
    ensure_loaded_for_range,
    get_all_slots,
    get_guest_schedule,
    reload_slots,
    reserve,
    cancel,
    waitlist,
)
from services.csv_dataset_service import recent_events, seed_csv_datasets
from services.guest_service import check_in_guest, get_guest, save_guest_consent
from services.analytics_service import get_busy_analytics, get_recommendations

app = FastAPI(
    title="Hotel Amenity Busy Analytics API",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Hotel Amenity Busy Analytics API", "status": "running"}


@app.get("/amenities/properties")
def list_properties():
    properties = []
    for prop in PROPERTIES:
        properties.append(
            {
                **prop,
                "amenities": get_property_amenities(prop["id"]),
            }
        )
    return {"properties": properties}


@app.get("/amenities/catalog")
def list_catalog():
    return {"collections": AMENITY_COLLECTIONS}


@app.get("/amenities/types")
def list_amenity_types(property_id: str | None = Query(default=None)):
    if property_id:
        return {"amenities": [amenity["name"] for amenity in get_property_amenities(property_id)]}
    return {"amenities": AMENITIES}




@app.get("/amenities/datasets")
def dataset_status():
    """Return CSV dataset paths and recent event logs for verification."""
    seeded = seed_csv_datasets()
    return {**seeded, "recent_events": recent_events()}


@app.get("/guests/{guest_id}", response_model=GuestResponse)
def guest_profile(guest_id: str):
    return GuestResponse(**get_guest(guest_id))


@app.post("/guests/check-in", response_model=GuestResponse)
def guest_check_in(req: GuestCheckInRequest):
    guest = check_in_guest(
        req.guest_id,
        req.guest_name,
        req.property_id,
        req.check_in,
        req.check_out,
    )
    return GuestResponse(**guest)


@app.post("/guests/consent", response_model=GuestResponse)
def guest_consent(req: ConsentRequest):
    guest = save_guest_consent(
        req.guest_id,
        req.property_id,
        req.plan_your_stay_enabled,
        req.selected_amenities,
    )
    return GuestResponse(**guest)


@app.get("/guests/{guest_id}/schedule")
def guest_schedule(guest_id: str):
    return {"schedule": get_guest_schedule(guest_id)}


@app.get("/amenities/availability")
def get_availability(
    property_id: str = Query(default="prop-001"),
    check_in: str | None = Query(default=None),
    check_out: str | None = Query(default=None),
):
    """Get all slots for a property within the given date range."""
    if check_in and check_out:
        reload_slots(property_id, check_in, check_out)
    slots = get_all_slots(property_id, check_in, check_out)
    return {"slots": slots, "total": len(slots)}


@app.post("/amenities/event", response_model=EventResponse)
def handle_event(req: EventRequest):
    """Reserve, cancel, or join the waitlist for a slot."""
    property_id = req.property_id

    event_type = req.event_type.upper()
    if event_type == "RESERVE":
        result = reserve(property_id, req.slot_id, req.guest_id)
    elif event_type == "CANCEL":
        result = cancel(property_id, req.slot_id, req.guest_id)
    elif event_type == "WAITLIST":
        result = waitlist(property_id, req.slot_id, req.guest_id)
    else:
        return EventResponse(
            success=False,
            message=f"Unknown event type: {req.event_type}",
            slot_id=req.slot_id,
            event_type=req.event_type,
            updated_available=0,
            updated_booked=0,
            waitlist_count=0,
        )

    if not result.get("success"):
        return EventResponse(
            success=False,
            message=result.get("message", "Operation failed"),
            slot_id=result.get("slot_id", req.slot_id),
            event_type=req.event_type,
            updated_available=result.get("updated_available", 0),
            updated_booked=result.get("updated_booked", 0),
            waitlist_count=result.get("waitlist_count", 0),
            waitlist_position=result.get("waitlist_position"),
            conflict_slot_id=result.get("conflict_slot_id"),
            conflict_amenity=result.get("conflict_amenity"),
            conflict_time_slot=result.get("conflict_time_slot"),
        )

    return EventResponse(**result)


def _slot_score_model(slot: dict) -> SlotScore:
    return SlotScore(
        slot_id=slot["slotId"],
        date=slot["date"],
        time_slot=slot["timeSlot"],
        busy_score=slot["busyScore"],
        demand_score=slot["demandScore"],
        future_busy=slot["futureBusy"],
        capacity=slot["capacity"],
        booked=slot["booked"],
        available=slot["available"],
        waitlist_count=slot.get("waitlist", 0),
        weather_condition=slot.get("weatherCondition", "clear"),
        traffic_condition=slot.get("trafficCondition", "light"),
        status=slot["status"],
    )


@app.post("/amenities/busy-analytics", response_model=BusyAnalyticsResponse)
def busy_analytics(req: BusyAnalyticsRequest):
    """Show busy analytics for a specific amenity during the stay."""
    ensure_loaded_for_range(req.property_id, req.check_in, req.check_out)
    slots = get_all_slots(req.property_id)
    analytics = get_busy_analytics(slots, req.amenity)

    return BusyAnalyticsResponse(
        property_id=req.property_id,
        amenity=req.amenity,
        slots=[_slot_score_model(s) for s in analytics],
    )


@app.post("/amenities/recommendations", response_model=RecommendationResponse)
def recommendations(req: RecommendationRequest):
    """Show smart recommendations for the best available times."""
    ensure_loaded_for_range(req.property_id, req.check_in, req.check_out)
    slots = get_all_slots(req.property_id)
    recs = get_recommendations(slots, req.amenity)

    rec_models = [
        Recommendation(
            slot_id=r["slotId"],
            date=r["date"],
            time_slot=r["timeSlot"],
            reason=r["reason"],
            busy_score=r["busyScore"],
            future_busy=r["futureBusy"],
            available=r["available"],
        )
        for r in recs
    ]

    return RecommendationResponse(
        property_id=req.property_id,
        amenity=req.amenity,
        recommendations=rec_models,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
