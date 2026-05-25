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

const BUSY_COLORS = {
  low: "#4caf50",
  medium: "#ff9800",
  high: "#f44336",
};

const RESORT_HIGHLIGHTS = [
  { value: "685", label: "Guest rooms & suites" },
  { value: "5-acre", label: "Tidal Cove waterpark" },
  { value: "3-story", label: "Spa & wellness collective" },
  { value: "2", label: "Championship golf courses" },
];

const FEATURED_AMENITY_TABS = [
  { id: "property", label: "Property Amenities", count: 12 },
  { id: "room", label: "Room Amenities", count: 4 },
  { id: "hotel", label: "Hotel Services", count: 7 },
  { id: "all", label: "View All", count: 23 },
];

const PROPERTY_AMENITIES_ONSITE = [
  { icon: "♻", name: "Sustainability" },
  { icon: "🍽", name: "Restaurant On-Site", detail: "1 Restaurant", amenity: "Restaurants" },
  { icon: "✓", name: "Convenience Store" },
  { icon: "🛎", name: "All-Suites" },
  { icon: "≈", name: "Outdoor Pool", detail: "Complimentary", amenity: "Pool" },
  { icon: "♨", name: "Whirlpool", detail: "Complimentary", amenity: "Whirlpool Onsite" },
  { icon: "⌁", name: "Cabanas/Palapas", detail: "$ 250.00", amenity: "Pool" },
  { icon: "🍸", name: "On-Site Bar", detail: "1 Bar", amenity: "Lounges" },
  { icon: "▣", name: "Business Center" },
  { icon: "▤", name: "Meeting Space" },
  { icon: "💪", name: "Fitness Center", detail: "Complimentary", amenity: "Fitness Center" },
  { icon: "▧", name: "On-Site Laundry" },
];

const ROOM_AMENITIES_ONSITE = [
  { icon: "☕", name: "Coffee Maker" },
  { icon: "▥", name: "In-Room Safe" },
  { icon: "▤", name: "Work Station" },
  { icon: "▣", name: "Private Balcony" },
];

const HOTEL_SERVICES_ONSITE = [
  { icon: "▱", name: "Free Hot Breakfast", detail: "Monday-Friday 6:30 AM-9:30 AM\nSaturday-Sunday 7:00 AM-10:00 AM", amenity: "Free Breakfast" },
  { icon: "✓", name: "Free Coffee/Tea in Lobby" },
  { icon: "♿", name: "Valet Dry Cleaning" },
  { icon: "♿", name: "Same Day Dry Cleaning" },
  { icon: "☼", name: "Wake-Up Calls" },
  { icon: "↗", name: "Service Request" },
  { icon: "✓", name: "Housekeeping", detail: "Every Other Day" },
];

function busyColor(score) {
  if (score <= 0.4) return BUSY_COLORS.low;
  if (score <= 0.7) return BUSY_COLORS.medium;
  return BUSY_COLORS.high;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export default function BusyAnalyticsDashboard() {
  const [properties, setProperties] = useState([]);
  const [amenityTypes, setAmenityTypes] = useState([]);
  const [propertyId, setPropertyId] = useState("prop-001");
  const [amenity, setAmenity] = useState("Spa");
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [checkIn] = useState(todayStr());
  const [checkOut] = useState(addDays(todayStr(), 3));
  const [guestName, setGuestName] = useState("Taylor Bonvoy");
  const [checkedIn, setCheckedIn] = useState(false);
  const [planEnabled, setPlanEnabled] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [eventMessage, setEventMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [guestSchedule, setGuestSchedule] = useState([]);
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
      setAmenity(loadedAmenityTypes[0] || "Spa");
      setGuestSchedule((await fetchGuestSchedule(GUEST_ID)) || []);
    }
    loadInitialData().catch(console.error);
  }, [propertyId]);

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === propertyId),
    [properties, propertyId],
  );

  const availableAmenityTypes = amenityTypes.filter((item) =>
    selectedAmenities.includes(item),
  );

  const loadSchedule = useCallback(async () => {
    setGuestSchedule((await fetchGuestSchedule(GUEST_ID)) || []);
  }, []);

  const loadAnalytics = useCallback(async (clearMessage = true) => {
    if (!amenity) return;
    setLoading(true);
    if (clearMessage) {
      setEventMessage("");
    }
    try {
      const [analyticsData, recData] = await Promise.all([
        fetchBusyAnalytics(propertyId, amenity, checkIn, checkOut),
        fetchRecommendations(propertyId, amenity, checkIn, checkOut),
      ]);
      setAnalytics(analyticsData);
      setRecommendations(recData.recommendations || []);
      const dates = [...new Set(analyticsData.slots.map((s) => s.date))];
      setSelectedDate(dates[0] || null);
      setSelectedSlot(null);
      await loadSchedule();
    } catch (err) {
      console.error(err);
      setEventMessage("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [propertyId, amenity, checkIn, checkOut, loadSchedule]);

  const handlePropertyChange = async (nextPropertyId) => {
    setPropertyId(nextPropertyId);
    setAnalytics(null);
    setRecommendations([]);
    setSelectedSlot(null);
    setEventMessage("");
    const propertyAmenityTypes = await fetchAmenityTypes(nextPropertyId);
    setAmenityTypes(propertyAmenityTypes);
    setSelectedAmenities(propertyAmenityTypes);
    setAmenity(propertyAmenityTypes[0] || "");
  };

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
    setEventMessage(`${guest.guest_name} checked in. You can now enable Plan Your Stay.`);
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
    if (guest.plan_your_stay_enabled) {
      setShowConsentModal(false);
    }
    setEventMessage(
      enabled
        ? "Guest consent captured. All selected amenities are enabled for planning."
        : "Plan Your Stay disabled for this guest.",
    );
  };

  const toggleAmenityFilter = (amenityName) => {
    setSelectedAmenities((current) => {
      const next = current.includes(amenityName)
        ? current.filter((item) => item !== amenityName)
        : [...current, amenityName];
      if (!next.includes(amenity)) {
        setAmenity(next[0] || "");
      }
      return next;
    });
  };

  const selectAllAmenities = () => {
    setSelectedAmenities(amenityTypes);
    setAmenity(amenityTypes[0] || "");
  };

  const savePlanningPreferences = async () => {
    const guest = await saveGuestConsent({
      guest_id: GUEST_ID,
      property_id: propertyId,
      plan_your_stay_enabled: planEnabled,
      selected_amenities: selectedAmenities,
    });
    setSelectedAmenities(guest.selected_amenities);
    setEventMessage("Amenity planning preferences saved.");
  };

  const handleEvent = async (slotId, eventType) => {
    try {
      const result = await postEvent(propertyId, slotId, eventType, GUEST_ID);
      setEventMessage(result.message);
      await loadSchedule();
      await loadAnalytics(false);
    } catch (err) {
      console.error(err);
      setEventMessage("Event failed");
    }
  };

  const uniqueDates = analytics
    ? [...new Set(analytics.slots.map((s) => s.date))]
    : [];

  const chartData =
    analytics && selectedDate
      ? analytics.slots
          .filter((s) => s.date === selectedDate)
          .map((s) => ({
            date: s.date,
            timeSlot: s.time_slot,
            busyScore: s.busy_score,
            demandScore: s.demand_score,
            futureBusy: s.future_busy,
            available: s.available,
            booked: s.booked,
            capacity: s.capacity,
            waitlistCount: s.waitlist_count,
            slotId: s.slot_id,
            status: s.status,
          }))
      : [];

  const scheduleConflictFor = (slot) =>
    guestSchedule.find(
      (item) =>
        item.date === slot.date &&
        item.time_slot === slot.timeSlot &&
        item.slot_id !== slot.slotId,
    );

  const isReservedByGuest = (slot) =>
    guestSchedule.some((item) => item.slot_id === slot.slotId);

  const tripPropertyName = selectedProperty?.name || "JW Marriott Miami Turnberry Resort & Spa";
  const featuredItems = activeFeatureTab === "hotel"
    ? HOTEL_SERVICES_ONSITE
    : activeFeatureTab === "room"
      ? ROOM_AMENITIES_ONSITE
      : activeFeatureTab === "all"
        ? [
            ...PROPERTY_AMENITIES_ONSITE,
            ...ROOM_AMENITIES_ONSITE,
            ...HOTEL_SERVICES_ONSITE,
          ]
        : PROPERTY_AMENITIES_ONSITE;
  const featuredTitle = activeFeatureTab === "hotel"
    ? "Hotel Services On-Site"
    : activeFeatureTab === "room"
      ? "Room Amenities On-Site"
      : activeFeatureTab === "all"
        ? "All Amenities & Services On-Site"
        : "Property Amenities On-Site";

  if (view === "landing") {
    return (
      <div className="bonvoy-page">
        <header className="bonvoy-topbar">
          <div className="bonvoy-logo">
            <span>Marriott</span>
            <strong>Bonvoy</strong>
          </div>
          <nav className="bonvoy-main-nav" aria-label="Marriott Bonvoy navigation">
            <span>Book</span>
            <span>Offers</span>
            <span>Brands</span>
            <span>Credit Cards</span>
            <span>Marriott Bonvoy</span>
            <span>Meetings &amp; Events</span>
          </nav>
          <div className="bonvoy-user-nav">
            <span>Help</span>
            <span>English</span>
            <span>Trips</span>
            <strong>Srikar reddy</strong>
          </div>
        </header>

        <nav className="bonvoy-tabs" aria-label="Account sections">
          {["Overview", "Activity", "Trips", "Favorites", "Promotions", "Profile"].map((tab) => (
            <button key={tab} className={tab === "Trips" ? "active" : ""}>
              {tab}
            </button>
          ))}
        </nav>

        <main className="bonvoy-content">
          <section className="member-card">
            <div className="member-greeting">Hi, Srikar reddy</div>
            <div className="member-stats">
              <div>
                <span>Member Since May 2023</span>
                <strong>Member</strong>
                <small>View Benefits &gt;</small>
              </div>
              <div>
                <span>7 Nights To Silver Elite</span>
                <strong>3 Nights</strong>
                <small>Nights Detail &gt;</small>
              </div>
              <div>
                <span>Expires May 2028</span>
                <strong>6,531 Points</strong>
                <small>Buy Points &gt;</small>
              </div>
            </div>
          </section>

          <section className="offer-card">
            <div className="offer-art">BONVOY<br />VISA</div>
            <div>
              <h2>Earn 4 Free Nights Valued up to 200,000 Points Total</h2>
              <p>And up to $100 in airline credits.</p>
            </div>
            <button>Learn More</button>
          </section>

          <section className="trip-tabs-row">
            <div className="trip-tab-buttons">
              <button className="active">Upcoming Trips</button>
              <button>Cancelled Trips</button>
            </div>
            <button className="reservation-search">Can&apos;t find a reservation? Search here</button>
          </section>

          <section className="upcoming-trip-card" onClick={() => setView("booking")} role="button" tabIndex={0}>
            <div className="trip-date-block">
              <span>May</span>
              <strong>25</strong>
            </div>
            <div>
              <span className="eyebrow">Upcoming Trip</span>
              <h2>{tripPropertyName}</h2>
              <p>Aventura, Florida · {checkIn} - {checkOut}</p>
            </div>
            <button onClick={(event) => { event.stopPropagation(); setView("booking"); }}>View Trip</button>
          </section>
        </main>
      </div>
    );
  }

  if (view === "trip") {
    return (
      <div className="bonvoy-page">
        <header className="bonvoy-topbar">
          <div className="bonvoy-logo">
            <span>Marriott</span>
            <strong>Bonvoy</strong>
          </div>
          <button className="plain-link" onClick={() => setView("landing")}>Back to Trips</button>
        </header>
        <main className="trip-detail-page">
          <section className="trip-hero-card">
            <span className="eyebrow">Upcoming Trip</span>
            <h1>{tripPropertyName}</h1>
            <p>{selectedProperty?.location || "Aventura, Florida"} · {checkIn} through {checkOut}</p>
          </section>
          <section className="trip-option-grid">
            <article className="trip-option-card">
              <h2>Booking</h2>
              <p>View reservation details, check in, and unlock Plan Your Stay.</p>
              <button className="black-btn" onClick={() => setView("booking")}>Open Booking</button>
            </article>
            <article className="trip-option-card">
              <h2>Amenities &amp; Services</h2>
              <p>Preview golf, spa, restaurants, lounges, EV charging, and resort services.</p>
              <button onClick={() => setView("booking")}>Plan Amenities</button>
            </article>
            <article className="trip-option-card">
              <h2>Hotel Details</h2>
              <p>Explore property highlights and available services for this stay.</p>
              <button onClick={() => setView("booking")}>View Details</button>
            </article>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="turnberry-shell">
      <button className="planner-back-link" onClick={() => setView("landing")}>Back to trips</button>
      <nav className="brand-bar" aria-label="Property navigation">
        <div className="brand-lockup">
          <span className="brand-mark">JW</span>
          <div>
            <span className="eyebrow">Marriott Bonvoy</span>
            <strong>Turnberry Amenity Intelligence</strong>
          </div>
        </div>
        <div className="nav-links" aria-hidden="true">
          <span>Overview</span>
          <span>Accommodations</span>
          <span>Dining</span>
          <span>Waterpark</span>
          <span>Experiences</span>
        </div>
      </nav>

      {showConsentModal && (
        <div className="consent-modal-backdrop" role="dialog" aria-modal="true">
          <article className="consent-modal-card enhance-canvas">
            <button
              className="modal-close"
              aria-label="Close consent dialog"
              onClick={() => setShowConsentModal(false)}
            >
              ×
            </button>
            <button className="canvas-toggle" onClick={() => handlePlanToggle(true)}>
              enable
            </button>
            <h3>Enhance Your Stay Experience</h3>
            <p>
              Enable Smart Amenity Insights to view real-time busy periods,
              wait times, and personalized recommendations for amenities and
              services during your stay.
            </p>
          </article>
        </div>
      )}

      <header className="resort-hero">
        <div className="hero-copy">
          <span className="eyebrow">Aventura, Florida</span>
          <h1>{tripPropertyName}</h1>
          <p>
            A tropical resort command center for check-in, guest consent, amenity
            planning, waitlists, and guest-specific scheduling safeguards.
          </p>
          <div className="hero-actions" aria-label="Property highlights">
            <span>Luxury resort</span>
            <span>Tidal Cove Waterpark</span>
            <span>Spa &amp; Wellness</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="Resort-inspired visual panel">
          <div className="visual-card visual-card-primary">
            <span>Plan Your Stay</span>
            <strong>{planEnabled ? "Enabled" : "Awaiting consent"}</strong>
            <small>{selectedProperty?.name || "Select a property"}</small>
          </div>
          <div className="visual-card visual-card-secondary">
            <span>Guest stay</span>
            <strong>{checkedIn ? "Checked in" : "Not checked in"}</strong>
            <small>{checkIn} through {checkOut}</small>
          </div>
        </div>
      </header>

      <section className="resort-overview" aria-label="Resort overview highlights">
        {RESORT_HIGHLIGHTS.map((item) => (
          <article className="overview-card" key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </section>

      <main className="dashboard">
        <section className="intro-section">
          <span className="eyebrow">Guest Journey</span>
          <h2>Check in, enable planning, then reserve amenities</h2>
          <p>
            Guests check in to a property first. After consent is captured, all
            property amenities are enabled by default and can be filtered before
            booking, waitlisting, or reviewing predicted busy windows.
          </p>
        </section>

        <section className="journey-grid simplified-journey">
          <article className="journey-card checkin-step-card">
            <span className="step-badge">1</span>
            <h3>Check in to property</h3>
            <div className="control-group">
              <label htmlFor="guestName">Guest name</label>
              <input
                id="guestName"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
            </div>
            <button className="btn black-checkin-btn" onClick={handleCheckIn}>
              {checkedIn ? "Checked In" : "Check In"}
            </button>
          </article>

          {checkedIn && (
            <article className="enhance-canvas">
              <label className="canvas-toggle">
                <input
                  type="checkbox"
                  checked={planEnabled}
                  onChange={(e) => handlePlanToggle(e.target.checked)}
                />
                <span>{planEnabled ? "disable" : "enable"}</span>
              </label>
              <h3>Enhance Your Stay Experience</h3>
              <p>
                Enable Smart Amenity Insights to view real-time busy periods,
                wait times, and personalized recommendations for amenities and
                services during your stay.
              </p>
            </article>
          )}

          {planEnabled && (
            <article className="journey-card schedule-card">
              <span className="step-badge">3</span>
              <h3>Guest schedule</h3>
              {guestSchedule.length === 0 ? (
                <p>No reserved amenities yet.</p>
              ) : (
                <ul className="schedule-list">
                  {guestSchedule.map((item) => (
                    <li key={item.slot_id}>
                      <strong>{item.amenity}</strong>
                      <span>{item.date} · {item.time_slot}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          )}
        </section>

        {planEnabled && (
          <>
        <section className="controls booking-panel" aria-label="Amenity analytics controls">
          <div className="control-group property-control">
            <label htmlFor="property">Property</label>
            <select
              id="property"
              value={propertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="fixed-stay-summary">
            <span>Fixed stay dates</span>
            <strong>{checkIn} - {checkOut}</strong>
          </div>

          <div className="control-group amenity-control">
            <label htmlFor="amenity">Amenity / service</label>
            <select
              id="amenity"
              value={amenity}
              onChange={(e) => setAmenity(e.target.value)}
              disabled={!planEnabled || availableAmenityTypes.length === 0}
            >
              {availableAmenityTypes.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-primary analytics-cta"
            onClick={() => loadAnalytics()}
            disabled={!checkedIn || !planEnabled || !amenity || loading}
          >
            {loading ? "Loading..." : "Get Busy Analytics"}
          </button>
        </section>

        <section className="featured-amenities-section amenity-filter-panel resort-panel">
          <div className="featured-heading">
            <span className="eyebrow">{tripPropertyName}</span>
            <h2>Featured Amenities On-Site</h2>
          </div>

          <div className="featured-tabs" role="tablist" aria-label="Featured amenities categories">
            {FEATURED_AMENITY_TABS.map((tab) => (
              <button
                key={tab.id}
                className={activeFeatureTab === tab.id ? "active" : ""}
                onClick={() => setActiveFeatureTab(tab.id)}
                role="tab"
                aria-selected={activeFeatureTab === tab.id}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <div className="featured-section-title-row">
            <h3>{featuredTitle}</h3>
            <span>⊙ included amenities (3)</span>
          </div>

          <div className="featured-amenities-grid">
            {featuredItems.map((item) => {
              const mappedAmenity = item.amenity;
              const selected = mappedAmenity && selectedAmenities.includes(mappedAmenity);
              return (
                <button
                  type="button"
                  key={`${activeFeatureTab}-${item.name}`}
                  className={`featured-amenity-item ${selected ? "selected" : ""}`}
                  onClick={() => mappedAmenity && toggleAmenityFilter(mappedAmenity)}
                  disabled={!mappedAmenity}
                >
                  <span className="featured-icon">{item.icon}</span>
                  <span className="featured-copy">
                    <strong>{item.name} {mappedAmenity ? "⊙" : ""}</strong>
                    {item.detail && <small>{item.detail}</small>}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="featured-filter-footer">
            <span>Analytics filters use the selectable on-site amenities that map to reservable services.</span>
            <div className="filter-actions">
              <button className="mini-btn" onClick={selectAllAmenities}>Enable all</button>
              <button className="mini-btn" onClick={() => setSelectedAmenities([])}>Clear</button>
              <button className="mini-btn" onClick={savePlanningPreferences} disabled={!planEnabled}>
                Save preferences
              </button>
            </div>
          </div>
        </section>

        {uniqueDates.length > 0 && (
          <section className="date-tabs" aria-label="Available stay dates">
            {uniqueDates.map((d) => (
              <button
                key={d}
                className={`date-tab ${selectedDate === d ? "active" : ""}`}
                onClick={() => {
                  setSelectedDate(d);
                  setSelectedSlot(null);
                }}
              >
                {d}
              </button>
            ))}
          </section>
        )}

        {chartData.length > 0 && (
          <section className="chart-section resort-panel">
            <div className="section-heading">
              <span className="eyebrow">Live Capacity</span>
              <h2>
                Busy Heatmap - {amenity} on {selectedDate}
              </h2>
              <p>
                Compare current busy score, demand score, and LightGBM futureBusy
                prediction before reserving or joining a waiting list.
              </p>
            </div>

            <div className="chart-frame">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={chartData}
                  onClick={(e) => {
                    if (e && e.activePayload) {
                      setSelectedSlot(e.activePayload[0].payload.slotId);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timeSlot" />
                  <YAxis domain={[0, 1]} />
                  <Tooltip
                    formatter={(value, name) => [
                      typeof value === "number" ? value.toFixed(2) : value,
                      name,
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="busyScore" name="Busy Score">
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.slotId}
                        fill={busyColor(entry.busyScore)}
                        stroke={
                          selectedSlot === entry.slotId ? "#1f1b17" : "transparent"
                        }
                        strokeWidth={selectedSlot === entry.slotId ? 3 : 0}
                      />
                    ))}
                  </Bar>
                  <Bar dataKey="demandScore" name="Demand Score" fill="#b89154" />
                  <Bar dataKey="futureBusy" name="futureBusy" fill="#5f7662" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="slot-grid">
              {chartData.map((slot) => {
                const conflict = scheduleConflictFor(slot);
                const reserved = isReservedByGuest(slot);
                const full = slot.available <= 0 || slot.status === "FULL";
                return (
                  <article
                    key={slot.slotId}
                    className={`slot-card ${selectedSlot === slot.slotId ? "selected" : ""} ${full ? "full" : ""}`}
                    onClick={() => setSelectedSlot(slot.slotId)}
                  >
                    <div className="slot-card-header">
                      <strong>{slot.timeSlot}</strong>
                      <span>{full ? "Full" : `${slot.available} open`}</span>
                    </div>
                    <p>
                      Busy {(slot.busyScore * 100).toFixed(0)}% · Demand {slot.demandScore.toFixed(2)} · futureBusy {(slot.futureBusy * 100).toFixed(0)}%
                    </p>
                    <small>Booked {slot.booked}/{slot.capacity} · Waitlist {slot.waitlistCount}</small>
                    {conflict && (
                      <em className="conflict-note">
                        Conflicts with {conflict.amenity} at {conflict.time_slot}
                      </em>
                    )}
                    <div className="slot-actions">
                      {reserved ? (
                        <button className="mini-btn danger" onClick={(e) => { e.stopPropagation(); handleEvent(slot.slotId, "CANCEL"); }}>
                          Cancel
                        </button>
                      ) : full ? (
                        <button className="mini-btn" onClick={(e) => { e.stopPropagation(); handleEvent(slot.slotId, "WAITLIST"); }}>
                          Join Waiting List
                        </button>
                      ) : (
                        <button
                          className="mini-btn primary"
                          disabled={Boolean(conflict)}
                          onClick={(e) => { e.stopPropagation(); handleEvent(slot.slotId, "RESERVE"); }}
                        >
                          Reserve
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {eventMessage && <p className="event-msg">{eventMessage}</p>}
          </section>
        )}

        {recommendations.length > 0 && (
          <section className="recommendations resort-panel">
            <div className="section-heading">
              <span className="eyebrow">Personalized Planning</span>
              <h2>Smart Recommendations</h2>
              <p>
                Recommendations use current occupancy and LightGBM futureBusy
                predictions to surface calmer amenity windows.
              </p>
            </div>
            <div className="rec-grid">
              {recommendations.map((rec) => (
                <div
                  key={rec.slot_id}
                  className={`rec-card ${selectedSlot === rec.slot_id ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedSlot(rec.slot_id);
                    setSelectedDate(rec.date);
                  }}
                >
                  <div className="rec-header">
                    <span className="rec-date">{rec.date}</span>
                    <span className="rec-time">{rec.time_slot}</span>
                  </div>
                  <div
                    className="rec-score"
                    style={{ color: busyColor(rec.future_busy) }}
                  >
                    futureBusy: {(rec.future_busy * 100).toFixed(0)}%
                  </div>
                  <p className="rec-reason">{rec.reason}</p>
                  <p className="rec-avail">{rec.available} spots available</p>
                </div>
              ))}
            </div>
          </section>
        )}
          </>
        )}
      </main>
    </div>
  );
}
