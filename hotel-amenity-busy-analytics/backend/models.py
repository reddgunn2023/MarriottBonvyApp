"""Pydantic request / response models for the Amenity Busy Analytics API."""

from pydantic import BaseModel


class GuestCheckInRequest(BaseModel):
    guest_id: str = "guest-default"
    guest_name: str = "Taylor Bonvoy"
    property_id: str = "prop-001"
    check_in: str
    check_out: str


class ConsentRequest(BaseModel):
    guest_id: str = "guest-default"
    property_id: str = "prop-001"
    plan_your_stay_enabled: bool
    selected_amenities: list[str] = []


class GuestResponse(BaseModel):
    guest_id: str
    guest_name: str
    property_id: str
    check_in: str
    check_out: str
    checked_in: bool
    plan_your_stay_enabled: bool
    selected_amenities: list[str]


class EventRequest(BaseModel):
    property_id: str
    slot_id: str
    event_type: str  # RESERVE | CANCEL | WAITLIST
    guest_id: str = "guest-default"


class EventResponse(BaseModel):
    success: bool
    message: str
    slot_id: str
    event_type: str
    updated_available: int
    updated_booked: int
    waitlist_count: int
    waitlist_position: int | None = None
    conflict_slot_id: str | None = None
    conflict_amenity: str | None = None
    conflict_time_slot: str | None = None


class BusyAnalyticsRequest(BaseModel):
    property_id: str
    amenity: str
    check_in: str
    check_out: str


class RecommendationRequest(BaseModel):
    property_id: str
    amenity: str
    check_in: str
    check_out: str


class SlotScore(BaseModel):
    slot_id: str
    date: str
    time_slot: str
    busy_score: float
    demand_score: float
    future_busy: float
    capacity: int
    booked: int
    available: int
    waitlist_count: int
    status: str


class BusyAnalyticsResponse(BaseModel):
    property_id: str
    amenity: str
    slots: list[SlotScore]


class Recommendation(BaseModel):
    slot_id: str
    date: str
    time_slot: str
    reason: str
    busy_score: float
    future_busy: float
    available: int


class RecommendationResponse(BaseModel):
    property_id: str
    amenity: str
    recommendations: list[Recommendation]
