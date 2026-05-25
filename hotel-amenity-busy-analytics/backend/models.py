"""Pydantic request / response models for the Amenity Busy Analytics API."""

from pydantic import BaseModel


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
    capacity: int
    booked: int
    available: int
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
    available: int


class RecommendationResponse(BaseModel):
    property_id: str
    amenity: str
    recommendations: list[Recommendation]
