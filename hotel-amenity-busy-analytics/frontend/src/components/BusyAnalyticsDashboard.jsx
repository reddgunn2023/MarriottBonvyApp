import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  checkInGuest,
  fetchAmenityTypes,
  fetchBusyAnalytics,
  fetchGuestSchedule,
  fetchProperties,
  fetchRecommendations,
  postEvent,
  saveGuestConsent,
} from "../services/amenityApi";
import "./BusyAnalyticsDashboard.css";

const GUEST_ID = "guest-default";
const DEFAULT_HOTEL_NAME = "Residence Inn at Anaheim Resort/Convention Center";

const FEATURED_AMENITY_TABS = [
  { id: "property", label: "Property Amenities", count: 12 },
  { id: "room", label: "Room Amenities", count: 4 },
  { id: "hotel", label: "Hotel Services", count: 7 },
  { id: "all", label: "View All", count: 23 },
];

const PROPERTY_AMENITIES_ONSITE = [
  { icon: "♻", name: "Sustainability" },
  { icon: "⌁", name: "Free Wifi" },
  { icon: "▱", name: "Free Hot Breakfast", detail: "Monday-Friday 6:30 - 9:30 AM\nSaturday-Sunday 7:00 - 10:00 AM", amenity: "Free Breakfast" },
  { icon: "☕", name: "Free Coffee/Tea" },
  { icon: "▤", name: "Convenience Store" },
  { icon: "▧", name: "Gift Shop" },
  { icon: "≈", name: "Outdoor Pool", amenity: "Pool" },
  { icon: "♨", name: "Hot Tub", amenity: "Whirlpool Onsite" },
  { icon: "💪", name: "Fitness Center", amenity: "Fitness Center" },
  { icon: "▣", name: "Meeting Space" },
  { icon: "🍽", name: "Restaurant", amenity: "Restaurants" },
  { icon: "▧", name: "Laundry" },
];

const ROOM_AMENITIES_ONSITE = [
  { icon: "▤", name: "Full Kitchen" },
  { icon: "☕", name: "Coffee Maker" },
  { icon: "⌁", name: "Free WiFi" },
  { icon: "▣", name: "Ergonomic Workspace" },
];

const HOTEL_SERVICES_ONSITE = [
  { icon: "▱", name: "Free Hot Breakfast", detail: "Monday-Friday 6:30 - 9:30 AM\nSaturday-Sunday 7:00 - 10:00 AM", amenity: "Free Breakfast" },
  { icon: "✓", name: "Free Coffee/Tea in Lobby" },
  { icon: "♿", name: "Dry Cleaning Service" },
  { icon: "☼", name: "Wake-Up Calls" },
  { icon: "↗", name: "Service Request" },
  { icon: "✓", name: "Digital Check In" },
  { icon: "▧", name: "Mobile Key" },
];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function busyColor(score) {
  if (score <= 0.4) return "#2e7d32";
  if (score <= 0.7) return "#b77716";
  return "#a23b2a";
}

export default function BusyAnalyticsDashboard() {
  const [properties, setProperties] = useState([]);
  const [amenityTypes, setAmenityTypes] = useState([]);
  const [propertyId] = useState("prop-001");
  const [amenity, setAmenity] = useState("Free Breakfast");
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [checkIn] = useState(todayStr());
  const [checkOut] = useState(addDays(todayStr(), 3));
  const [guestName, setGuestName] = useState("Taylor Bonvoy");
  const [checkedIn, setCheckedIn] = useState(false);
  const [planEnabled, setPlanEnabled] = useState(false);
  const [analyticsByAmenity, setAnalyticsByAmenity] = useState({});
  const [recommendationsByAmenity, setRecommendationsByAmenity] = useState({});
  const [actionStates, setActionStates] = useState({});
  const [selectedSlotsByAmenity, setSelectedSlotsByAmenity] = useState({});
  const [eventMessage, setEventMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setGuestSchedule] = useState([]);
  const [view, setView] = useState("landing");
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [activeFeatureTab, setActiveFeatureTab] = useState("property");

  useEffect(() => {
    async function loadInitialData() {
      const loadedProperties = await fetchProperties();
      setProperties(loadedProperties);
      const loadedAmenityTypes = await fetchAmenityTypes(propertyId);
      setAmenityTypes(loadedAmenityTypes);
      setSelectedAmenities(loadedAmenityTypes);
      setAmenity(loadedAmenityTypes.includes("Free Breakfast") ? "Free Breakfast" : loadedAmenityTypes[0] || "");
      setGuestSchedule((await fetchGuestSchedule(GUEST_ID)) || []);
    }
    loadInitialData().catch(console.error);
  }, [propertyId]);

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === propertyId),
    [properties, propertyId],
  );

  const tripPropertyName = selectedProperty?.name || DEFAULT_HOTEL_NAME;
  const featuredItems = activeFeatureTab === "hotel"
    ? HOTEL_SERVICES_ONSITE
    : activeFeatureTab === "room"
      ? ROOM_AMENITIES_ONSITE
      : activeFeatureTab === "all"
        ? [...PROPERTY_AMENITIES_ONSITE, ...ROOM_AMENITIES_ONSITE, ...HOTEL_SERVICES_ONSITE]
        : PROPERTY_AMENITIES_ONSITE;
  const featuredTitle = activeFeatureTab === "hotel"
    ? "Hotel Services On-Site"
    : activeFeatureTab === "room"
      ? "Room Amenities On-Site"
      : activeFeatureTab === "all"
        ? "All Amenities & Services On-Site"
        : "Property Amenities On-Site";

  const selectedAmenityList = selectedAmenities.length ? selectedAmenities : amenityTypes;
  const analyticsEntries = Object.entries(analyticsByAmenity);
  const chartDataFor = (slots) => slots.map((slot) => ({
    label: slot.time_slot,
    date: slot.date,
    busyScore: slot.busy_score,
    demandScore: slot.demand_score,
    futureBusy: slot.future_busy,
    slot,
  }));

  const loadSchedule = useCallback(async () => {
    setGuestSchedule((await fetchGuestSchedule(GUEST_ID)) || []);
  }, []);

  const loadAnalytics = useCallback(async (clearMessage = true) => {
    const amenitiesToLoad = selectedAmenityList.filter(Boolean);
    if (!amenitiesToLoad.length) return;
    setLoading(true);
    if (clearMessage) setEventMessage("");
    try {
      const results = await Promise.all(
        amenitiesToLoad.map(async (item) => {
          const [analyticsData, recData] = await Promise.all([
            fetchBusyAnalytics(propertyId, item, checkIn, checkOut),
            fetchRecommendations(propertyId, item, checkIn, checkOut),
          ]);
          return [item, analyticsData, recData.recommendations || []];
        }),
      );
      setAnalyticsByAmenity(Object.fromEntries(results.map(([item, analyticsData]) => [item, analyticsData.slots || []])));
      setRecommendationsByAmenity(Object.fromEntries(results.map(([item, , recs]) => [item, recs])));
      await loadSchedule();
    } catch (err) {
      console.error(err);
      setEventMessage("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [propertyId, selectedAmenityList, checkIn, checkOut, loadSchedule]);

  const handleCheckIn = async () => {
    const guest = await checkInGuest({
      guest_id: GUEST_ID,
      guest_name: guestName,
      property_id: propertyId,
      check_in: checkIn,
      check_out: checkOut,
    });
    setCheckedIn(guest.checked_in);
    setShowConsentModal(true);
    setEventMessage(`${guest.guest_name} checked in.`);
  };

  const handlePlanToggle = async (enabled) => {
    const selected = selectedAmenities.length ? selectedAmenities : amenityTypes;
    const guest = await saveGuestConsent({
      guest_id: GUEST_ID,
      property_id: propertyId,
      plan_your_stay_enabled: enabled,
      selected_amenities: selected,
    });
    setPlanEnabled(guest.plan_your_stay_enabled);
    setSelectedAmenities(guest.selected_amenities);
    if (guest.plan_your_stay_enabled) setShowConsentModal(false);
    setEventMessage(enabled ? "Smart Amenity Insights enabled." : "Smart Amenity Insights disabled.");
  };

  const toggleAmenityFilter = (amenityName) => {
    setSelectedAmenities((current) => {
      const next = current.includes(amenityName)
        ? current.filter((item) => item !== amenityName)
        : [...current, amenityName];
      if (!next.includes(amenity)) setAmenity(next[0] || "");
      return next;
    });
  };

  const handleEvent = async (slotId, eventType) => {
    try {
      const result = await postEvent(propertyId, slotId, eventType, GUEST_ID);
      setActionStates((current) => ({
        ...current,
        [slotId]: eventType === "RESERVE"
          ? "RESERVED"
          : eventType === "CANCEL"
            ? "CANCELLED"
            : "WAITLISTED",
      }));
      setEventMessage(result.message);
      await loadSchedule();
      await loadAnalytics(false);
    } catch (err) {
      console.error(err);
      setEventMessage("Event failed");
    }
  };

  const slotAction = (slot) => {
    const full = slot.available <= 0 || slot.status === "FULL";
    const actionState = actionStates[slot.slot_id];
    if (actionState === "RESERVED") {
      return (
        <div className="table-action-group">
          <button className="table-action state-reserved" disabled>Reserved</button>
          <button className="table-action state-cancel" onClick={() => handleEvent(slot.slot_id, "CANCEL")}>Cancel</button>
        </div>
      );
    }
    if (actionState === "CANCELLED") {
      return <button className="table-action state-cancelled" disabled>Cancelled</button>;
    }
    if (actionState === "WAITLISTED") {
      return <button className="table-action state-waitlisted" disabled>Added to Waiting List</button>;
    }
    return (
      <button className="table-action" onClick={() => handleEvent(slot.slot_id, full ? "WAITLIST" : "RESERVE")}>
        {full ? "Join Waiting Line" : "Reserve"}
      </button>
    );
  };

  if (view === "landing") {
    return (
      <div className="bonvoy-page enterprise-bonvoy-page">
        <header className="bonvoy-topbar">
          <div className="bonvoy-logo"><span>Marriott</span><strong>Bonvoy</strong></div>
          <nav className="bonvoy-main-nav" aria-label="Marriott Bonvoy navigation">
            <span>Book</span><span>Offers</span><span>Brands</span><span>Credit Cards</span><span>Marriott Bonvoy</span><span>Meetings &amp; Events</span>
          </nav>
          <div className="bonvoy-user-nav"><span>Help</span><span>English</span><span>Trips</span><strong>Srikar reddy</strong></div>
        </header>
        <nav className="bonvoy-tabs" aria-label="Account sections">
          {["Overview", "Activity", "Trips", "Favorites", "Promotions", "Profile"].map((tab) => (
            <button key={tab} className={tab === "Trips" ? "active" : ""}>{tab}</button>
          ))}
        </nav>
        <main className="bonvoy-content">
          <section className="member-card">
            <div className="member-greeting">Hi, Srikar reddy</div>
            <div className="member-stats">
              <div><span>Member Since May 2023</span><strong>Member</strong><small>View Benefits &gt;</small></div>
              <div><span>7 Nights To Silver Elite</span><strong>3 Nights</strong><small>Nights Detail &gt;</small></div>
              <div><span>Expires May 2028</span><strong>6,531 Points</strong><small>Buy Points &gt;</small></div>
            </div>
          </section>
          <section className="trip-tabs-row">
            <div className="trip-tab-buttons"><button className="active">Upcoming Trips</button><button>Cancelled Trips</button></div>
            <button className="reservation-search">Can&apos;t find a reservation? Search here</button>
          </section>
          <section className="upcoming-trip-card" onClick={() => setView("booking")} role="button" tabIndex={0}>
            <div className="trip-date-block"><span>May</span><strong>25</strong></div>
            <div><span className="eyebrow">Upcoming Trip</span><h2>{tripPropertyName}</h2><p>Anaheim, California · {checkIn} - {checkOut}</p></div>
            <button onClick={(event) => { event.stopPropagation(); setView("booking"); }}>View Trip</button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="enterprise-page">
      <header className="enterprise-topbar">
        <button className="plain-link" onClick={() => setView("landing")}>Back to Trips</button>
        <div className="enterprise-brand"><span>Marriott Bonvoy</span><strong>Amenity Intelligence</strong></div>
      </header>

      {showConsentModal && (
        <div className="consent-modal-backdrop" role="dialog" aria-modal="true">
          <article className="consent-modal-card enterprise-consent-card">
            <button className="modal-close" aria-label="Close consent dialog" onClick={() => setShowConsentModal(false)}>×</button>
            <h3>Enable Smart Amenity Insights?</h3>
            <p>View real-time busy periods, wait times, and personalized recommendations for amenities and services during your stay.</p>
            <div className="modal-actions"><button className="black-btn" onClick={() => handlePlanToggle(true)}>Enable Insights</button></div>
          </article>
        </div>
      )}

      <main className="enterprise-main">
        <section className="enterprise-property-header">
          <div>
            <span className="eyebrow">Anaheim, California</span>
            <h1>{tripPropertyName}</h1>
            <p>Enterprise amenity operations dashboard for guest stay planning and service recommendations.</p>
          </div>
          <div className="enterprise-stay-panel">
            <span>Stay Window</span>
            <strong>{checkIn} - {checkOut}</strong>
            <small>{checkedIn ? "Checked in" : "Check-in required"}</small>
          </div>
        </section>

        {!checkedIn ? (
          <section className="enterprise-checkin-panel">
            <div className="control-group">
              <label htmlFor="guestName">Guest name</label>
              <input id="guestName" value={guestName} onChange={(event) => setGuestName(event.target.value)} />
            </div>
            <button className="black-btn" onClick={handleCheckIn}>Check In</button>
          </section>
        ) : !planEnabled ? (
          <section className="enterprise-enable-panel">
            <h2>Smart Amenity Insights</h2>
            <p>Enable insights to unlock amenity metrics, waitlist actions, and recommendations.</p>
            <button className="black-btn" onClick={() => setShowConsentModal(true)}>Enable Feature</button>
          </section>
        ) : (
          <>
            <section className="featured-amenities-section enterprise-card">
              <div className="featured-heading">
                <span className="eyebrow">{tripPropertyName}</span>
                <h2>Featured Amenities On-Site</h2>
              </div>
              <div className="featured-tabs" role="tablist" aria-label="Featured amenities categories">
                {FEATURED_AMENITY_TABS.map((tab) => (
                  <button key={tab.id} className={activeFeatureTab === tab.id ? "active" : ""} onClick={() => setActiveFeatureTab(tab.id)} role="tab" aria-selected={activeFeatureTab === tab.id}>
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
              <div className="featured-section-title-row"><h3>{featuredTitle}</h3><span>⊙ included amenities (3)</span></div>
              <div className="featured-amenities-grid">
                {featuredItems.map((item) => {
                  const mappedAmenity = item.amenity;
                  const selected = mappedAmenity && selectedAmenities.includes(mappedAmenity);
                  return (
                    <button type="button" key={`${activeFeatureTab}-${item.name}`} className={`featured-amenity-item ${selected ? "selected" : ""}`} onClick={() => mappedAmenity && toggleAmenityFilter(mappedAmenity)} disabled={!mappedAmenity}>
                      <span className="featured-icon">{item.icon}</span>
                      <span className="featured-copy"><strong>{item.name} {mappedAmenity ? "⊙" : ""}</strong>{item.detail && <small>{item.detail}</small>}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="enterprise-toolbar enterprise-card multi-amenity-toolbar">
              <div className="stay-range-inline">
                <span>Checkin Date:</span><strong>{checkIn}</strong>
              </div>
              <div className="stay-range-inline">
                <span>Checkout Date:</span><strong>{checkOut}</strong>
              </div>
              <div className="multi-select-panel">
                <span>Amenities & Services</span>
                <div className="multi-select-chip-grid">
                  {amenityTypes.map((item) => (
                    <label className={`multi-select-chip ${selectedAmenities.includes(item) ? "selected" : ""}`} key={item}>
                      <input
                        type="checkbox"
                        checked={selectedAmenities.includes(item)}
                        onChange={() => toggleAmenityFilter(item)}
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
              <button className="black-btn" onClick={() => loadAnalytics()} disabled={!selectedAmenityList.length || loading}>{loading ? "Loading" : "View Analytics"}</button>
            </section>

            {analyticsEntries.length > 0 && analyticsEntries.map(([amenityName, rows]) => (
              <section className="enterprise-card analytics-workspace" key={amenityName}>
                <div className="analytics-heading"><div><span className="eyebrow">Stay Range Metrics</span><h2>{amenityName}</h2><p>Busy, demand, and forecast metrics are shown in 30-minute intervals from check-in to checkout.</p></div></div>
                <div className="enterprise-chart-frame">
                  <ResponsiveContainer width="100%" height={360}>
                    <BarChart
                      data={chartDataFor(rows)}
                      onClick={(event) => {
                        const slot = event?.activePayload?.[0]?.payload?.slot;
                        if (slot) {
                          setSelectedSlotsByAmenity((current) => ({ ...current, [amenityName]: slot }));
                        }
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="label"
                        interval="preserveStartEnd"
                        minTickGap={18}
                        angle={-35}
                        textAnchor="end"
                        height={72}
                      />
                      <YAxis domain={[0, 1.5]} />
                      <Tooltip
                        formatter={(value, name) => [typeof value === "number" ? value.toFixed(2) : value, name]}
                        labelFormatter={(_label, payload) => {
                          const slot = payload?.[0]?.payload?.slot;
                          return slot ? `${slot.date} · ${slot.time_slot}` : _label;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="busyScore" name="Busy" fill="#1f6f9f" cursor="pointer" isAnimationActive={false} onClick={(data) => data?.slot && setSelectedSlotsByAmenity((current) => ({ ...current, [amenityName]: data.slot }))} />
                      <Bar dataKey="demandScore" name="Demand" fill="#8b6f47" cursor="pointer" isAnimationActive={false} onClick={(data) => data?.slot && setSelectedSlotsByAmenity((current) => ({ ...current, [amenityName]: data.slot }))} />
                      <Bar dataKey="futureBusy" name="Forecast" fill="#556b58" cursor="pointer" isAnimationActive={false} onClick={(data) => data?.slot && setSelectedSlotsByAmenity((current) => ({ ...current, [amenityName]: data.slot }))}>
                        {chartDataFor(rows).map((entry, index) => <Cell key={`${entry.date}-${entry.label}-${index}`} fill={busyColor(entry.futureBusy)} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {selectedSlotsByAmenity[amenityName] ? (
                  <div className="slot-detail-card">
                    <div>
                      <span className="eyebrow">Selected 30-minute slot</span>
                      <h3>{selectedSlotsByAmenity[amenityName].time_slot}</h3>
                      <p>{selectedSlotsByAmenity[amenityName].date} · {amenityName}</p>
                    </div>
                    <dl>
                      <div><dt>Busy</dt><dd>{selectedSlotsByAmenity[amenityName].busy_score.toFixed(2)}</dd></div>
                      <div><dt>Demand</dt><dd>{selectedSlotsByAmenity[amenityName].demand_score.toFixed(2)}</dd></div>
                      <div><dt>Forecast</dt><dd>{selectedSlotsByAmenity[amenityName].future_busy.toFixed(2)}</dd></div>
                      <div><dt>Weather</dt><dd>{selectedSlotsByAmenity[amenityName].weather_condition || "Clear"}</dd></div>
                      <div><dt>Traffic</dt><dd>{selectedSlotsByAmenity[amenityName].traffic_condition || "Light"}</dd></div>
                      <div><dt>Availability</dt><dd>{selectedSlotsByAmenity[amenityName].available <= 0 ? "Full" : `${selectedSlotsByAmenity[amenityName].available} open`}</dd></div>
                    </dl>
                    <div className="slot-detail-actions">{slotAction(selectedSlotsByAmenity[amenityName])}</div>
                  </div>
                ) : (
                  <div className="slot-detail-empty">Click a bar to view that 30-minute slot and choose Reserve, Cancel, or Join Waiting Line.</div>
                )}
                {eventMessage && <p className="event-msg enterprise-event-msg">{eventMessage}</p>}
              </section>
            ))}

            {Object.values(recommendationsByAmenity).some((items) => items.length > 0) && (
              <section className="enterprise-card smart-recommendations-panel">
                <div className="section-heading"><span className="eyebrow">Smart Recommendations</span><h2>Recommended Planning Windows</h2></div>
                <div className="enterprise-rec-list">
                  {Object.entries(recommendationsByAmenity).flatMap(([amenityName, recs]) =>
                    recs.map((rec) => <article key={`${amenityName}-${rec.slot_id}`}><strong>{amenityName} · {rec.date} · {rec.time_slot}</strong><p>{rec.reason}</p></article>),
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
