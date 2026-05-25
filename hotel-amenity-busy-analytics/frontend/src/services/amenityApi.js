import axios from "axios";

const API_BASE = "/amenities";
const GUEST_BASE = "/guests";

export async function fetchProperties() {
  const res = await axios.get(`${API_BASE}/properties`);
  return res.data.properties;
}

export async function fetchAmenityTypes(propertyId) {
  const res = await axios.get(`${API_BASE}/types`, {
    params: propertyId ? { property_id: propertyId } : {},
  });
  return res.data.amenities;
}

export async function fetchAvailability(propertyId, checkIn, checkOut) {
  const res = await axios.get(`${API_BASE}/availability`, {
    params: {
      property_id: propertyId,
      check_in: checkIn,
      check_out: checkOut,
    },
  });
  return res.data.slots;
}

export async function checkInGuest(guest) {
  const res = await axios.post(`${GUEST_BASE}/check-in`, guest);
  return res.data;
}

export async function saveGuestConsent(consent) {
  const res = await axios.post(`${GUEST_BASE}/consent`, consent);
  return res.data;
}

export async function fetchGuestProfile(guestId) {
  const res = await axios.get(`${GUEST_BASE}/${guestId}`);
  return res.data;
}

export async function fetchGuestSchedule(guestId) {
  const res = await axios.get(`${GUEST_BASE}/${guestId}/schedule`);
  return res.data.schedule || [];
}

export async function fetchBusyAnalytics(
  propertyId,
  amenity,
  checkIn,
  checkOut,
) {
  const res = await axios.post(`${API_BASE}/busy-analytics`, {
    property_id: propertyId,
    amenity,
    check_in: checkIn,
    check_out: checkOut,
  });
  return res.data;
}

export async function fetchRecommendations(
  propertyId,
  amenity,
  checkIn,
  checkOut,
) {
  const res = await axios.post(`${API_BASE}/recommendations`, {
    property_id: propertyId,
    amenity,
    check_in: checkIn,
    check_out: checkOut,
  });
  return res.data;
}

export async function postEvent(
  propertyId,
  slotId,
  eventType,
  guestId = "guest-default",
) {
  const res = await axios.post(`${API_BASE}/event`, {
    property_id: propertyId,
    slot_id: slotId,
    event_type: eventType,
    guest_id: guestId,
  });
  return res.data;
}
