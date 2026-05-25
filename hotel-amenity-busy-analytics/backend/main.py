"""FastAPI application — Hotel Amenity Busy Analytics API."""

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from models import (
    BusyAnalyticsRequest,
    BusyAnalyticsResponse,
    EventRequest,
    EventResponse,
    RecommendationRequest,
    RecommendationResponse,
    SlotScore,
    Recommendation,
)
from data.mock_slots import PROPERTIES, AMENITIES
from services.booking_service import (
    ensure_loaded_for_range,
    get_all_slots,
    reload_slots,
    reserve,
    cancel,
    waitlist,
)
from services.analytics_service import get_busy_analytics, get_recommendations

app = FastAPI(
    title="Hotel Amenity Busy Analytics API",
    version="1.0.0",
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
    return {"properties": PROPERTIES}


@app.get("/amenities/types")
def list_amenity_types():
    return {"amenities": AMENITIES}


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
        result = reserve(property_id, req.slot_id)
    elif event_type == "CANCEL":
        result = cancel(property_id, req.slot_id)
    elif event_type == "WAITLIST":
        result = waitlist(property_id, req.slot_id)
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
            slot_id=req.slot_id,
            event_type=req.event_type,
            updated_available=result.get("updated_available", 0),
            updated_booked=result.get("updated_booked", 0),
            waitlist_count=result.get("waitlist_count", 0),
        )

    return EventResponse(**result)


@app.post("/amenities/busy-analytics", response_model=BusyAnalyticsResponse)
def busy_analytics(req: BusyAnalyticsRequest):
    """Show busy analytics for a specific amenity during the stay."""
    ensure_loaded_for_range(req.property_id, req.check_in, req.check_out)
    slots = get_all_slots(req.property_id)
    analytics = get_busy_analytics(slots, req.amenity)

    slot_scores = [
        SlotScore(
            slot_id=s["slotId"],
            date=s["date"],
            time_slot=s["timeSlot"],
            busy_score=s["busyScore"],
            demand_score=s["demandScore"],
            capacity=s["capacity"],
            booked=s["booked"],
            available=s["available"],
            status=s["status"],
        )
        for s in analytics
    ]

    return BusyAnalyticsResponse(
        property_id=req.property_id,
        amenity=req.amenity,
        slots=slot_scores,
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
