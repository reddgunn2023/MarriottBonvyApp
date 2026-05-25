import axios from "axios";

const API_BASE = "/amenities";

export async function fetchProperties() {
  const res = await axios.get(`${API_BASE}/properties`);
  return res.data.properties;
}

export async function fetchAmenityTypes() {
  const res = await axios.get(`${API_BASE}/types`);
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

export async function postEvent(slotId, eventType, guestId = "guest-default") {
  const res = await axios.post(`${API_BASE}/event`, {
    slot_id: slotId,
    event_type: eventType,
    guest_id: guestId,
  });
  return res.data;
}
