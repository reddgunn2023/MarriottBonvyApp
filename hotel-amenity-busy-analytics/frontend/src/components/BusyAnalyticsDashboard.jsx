import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import {
  checkInGuest,
  fetchAmenityTypes,
  fetchBusyAnalytics,
  fetchGuestProfile,
  fetchGuestSchedule,
  fetchProperties,
  postEvent,
  saveGuestConsent,
} from "../services/amenityApi";
import "./BusyAnalyticsDashboard.css";

const DEFAULT_HOTEL_NAME = "Residence Inn at Anaheim Resort/Convention Center";
const IMPORTANT_AMENITIES = ["Free Breakfast", "Pool", "Fitness Center", "Lounges"];
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
  { icon: "🛏", name: "All-Suites" },
  { icon: "≈", name: "Outdoor Pool", detail: "Complimentary", amenity: "Pool" },
  { icon: "♨", name: "Whirlpool", detail: "Complimentary", amenity: "Whirlpool Onsite" },
  { icon: "⛱", name: "Cabanas/Palapas", detail: "$250.00", amenity: "Cabanas" },
  { icon: "🍸", name: "On-Site Bar", detail: "1 Bar", amenity: "Lounges" },
  { icon: "▣", name: "Business Center" },
  { icon: "▤", name: "Meeting Space" },
  { icon: "🏋", name: "Fitness Center", detail: "Complimentary", amenity: "Fitness Center" },
  { icon: "▧", name: "On-Site Laundry" },
];

const ROOM_AMENITIES_ONSITE = [
  { icon: "▤", name: "Full Kitchen" },
  { icon: "☕", name: "Coffee Maker" },
  { icon: "⌁", name: "Free WiFi" },
  { icon: "▣", name: "Ergonomic Workspace" },
];

const HOTEL_SERVICES_ONSITE = [
  { icon: "☕", name: "Free Hot Breakfast", detail: "Monday-Friday 6:30 AM-9:30 AM\nSaturday-Sunday 7:00 AM-10:00 AM", amenity: "Free Breakfast" },
  { icon: "✓", name: "Free Coffee/Tea in Lobby" },
  { icon: "♿", name: "Valet Dry Cleaning" },
  { icon: "♿", name: "Same Day Dry Cleaning" },
  { icon: "☼", name: "Wake-Up Calls" },
  { icon: "↗", name: "Service Request" },
  { icon: "✓", name: "Housekeeping", detail: "Every Other Day" },
];

function todayStr() {
  return "2026-03-26";
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function statusColor(entry) {
  if (entry.slot?.weather_blocked || entry.slot?.status === "WEATHER_BLOCKED") return "#9ca3af";
  if (entry.statusScore <= 0.4) return "#2e7d32";
  if (entry.statusScore <= 0.7) return "#b77716";
  return "#a23b2a";
}

function scoreLevel(score) {
  if (score >= 0.7) return "High";
  if (score >= 0.4) return "Moderate";
  return "Low";
}

function forecastSummary(slot) {
  if (slot.weather_blocked || slot.status === "WEATHER_BLOCKED") {
    return "This outdoor activity might be cancelled during the selected time because severe weather is forecast. Consider another time or an indoor amenity.";
  }
  const level = scoreLevel(slot.future_busy);
  if (level === "High") {
    return "High forecast: expect heavier usage. Consider alternate times or join the waiting line if full.";
  }
  if (level === "Moderate") {
    return "Moderate forecast: this slot is usable, but demand may build as the stay window approaches.";
  }
  return "Low forecast: recommended as a calmer planning window.";
}

function formatTimeSlot(slot) {
  return slot.replace(/\b0(\d):/g, "$1:").replace(/:/g, ".");
}

function routeContext() {
  const [propertyFromPath, userFromPath] = window.location.pathname
    .split("/")
    .filter(Boolean);
  return {
    propertyId: propertyFromPath || "prop-001",
    guestId: userFromPath || "guest-default",
  };
}

export default function BusyAnalyticsDashboard() {
  const [{ propertyId, guestId }] = useState(routeContext);
  const [properties, setProperties] = useState([]);
  const [amenityTypes, setAmenityTypes] = useState([]);
  const [amenity, setAmenity] = useState("Free Breakfast");
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [checkIn, setCheckIn] = useState(todayStr());
  const [checkOut, setCheckOut] = useState(addDays(todayStr(), 3));
  const [selectedAnalyticsDate, setSelectedAnalyticsDate] = useState(todayStr());
  const [guestName, setGuestName] = useState("Taylor Bonvoy");
  const [checkedIn, setCheckedIn] = useState(false);
  const [planEnabled, setPlanEnabled] = useState(false);
  const [analyticsByAmenity, setAnalyticsByAmenity] = useState({});
  const [actionStates, setActionStates] = useState({});
  const [selectedSlotsByAmenity, setSelectedSlotsByAmenity] = useState({});
  const [eventMessage, setEventMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setGuestSchedule] = useState([]);
  const [view, setView] = useState("landing");
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [activeAmenityTab, setActiveAmenityTab] = useState("property");

  useEffect(() => {
    async function loadInitialData() {
      const loadedProperties = await fetchProperties();
      setProperties(loadedProperties);
      const guestProfile = await fetchGuestProfile(guestId);
      if (guestProfile.guest_name) setGuestName(guestProfile.guest_name);
      if (guestProfile.check_in) {
        setCheckIn(guestProfile.check_in);
        setSelectedAnalyticsDate(guestProfile.check_in);
      }
      if (guestProfile.check_out) setCheckOut(guestProfile.check_out);
      setCheckedIn(Boolean(guestProfile.checked_in));
      setPlanEnabled(Boolean(guestProfile.plan_your_stay_enabled));
      const loadedAmenityTypes = await fetchAmenityTypes(propertyId);
      const defaultSelected = (guestProfile.selected_amenities?.length ? guestProfile.selected_amenities : IMPORTANT_AMENITIES)
        .filter((item) => loadedAmenityTypes.includes(item));
      setAmenityTypes(loadedAmenityTypes);
      setSelectedAmenities(defaultSelected.length ? defaultSelected : loadedAmenityTypes);
      setAmenity(defaultSelected[0] || loadedAmenityTypes[0] || "");
      setGuestSchedule((await fetchGuestSchedule(guestId)) || []);
    }
    loadInitialData().catch(console.error);
  }, [propertyId, guestId]);

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === propertyId),
    [properties, propertyId],
  );

  const tripPropertyName = selectedProperty?.name || DEFAULT_HOTEL_NAME;
  const featuredItems = activeAmenityTab === "hotel"
    ? HOTEL_SERVICES_ONSITE
    : activeAmenityTab === "room"
      ? ROOM_AMENITIES_ONSITE
      : activeAmenityTab === "all"
        ? [...PROPERTY_AMENITIES_ONSITE, ...ROOM_AMENITIES_ONSITE, ...HOTEL_SERVICES_ONSITE]
        : PROPERTY_AMENITIES_ONSITE;
  const featuredTitle = activeAmenityTab === "hotel"
    ? "Hotel Services On-Site"
    : activeAmenityTab === "room"
      ? "Room Amenities On-Site"
      : activeAmenityTab === "all"
        ? "All Amenities & Services On-Site"
        : "Property Amenities On-Site";

  const selectedAmenityList = useMemo(() => (amenity ? [amenity] : []), [amenity]);
  const analyticsEntries = Object.entries(analyticsByAmenity);
  const chartDataFor = (slots) => {
    const buckets = new Map();
    slots
      .filter((slot) => slot.date === selectedAnalyticsDate)
      .forEach((slot) => {
        const [start] = slot.time_slot.split("-");
        const hour = start.split(":")[0];
        const bucketStart = `${hour}:00`;
        const bucketEnd = `${String((Number(hour) + 1) % 24).padStart(2, "0")}:00`;
        const key = `${bucketStart}-${bucketEnd}`;
        const existing = buckets.get(key) || {
          label: formatTimeSlot(key),
          date: slot.date,
          slots: [],
          busyScore: 0,
          demandScore: 0,
          futureBusy: 0,
          statusScore: 0,
        };
        existing.slots.push(slot);
        existing.busyScore += slot.busy_score;
        existing.demandScore += slot.demand_score;
        existing.futureBusy += slot.future_busy;
        if (slot.weather_blocked || slot.status === "WEATHER_BLOCKED") {
          existing.weather_blocked = true;
        }
        buckets.set(key, existing);
      });

    return Array.from(buckets.values()).map((bucket) => {
      const count = bucket.slots.length || 1;
      const representativeSlot = bucket.slots.find((slot) => slot.weather_blocked || slot.status === "WEATHER_BLOCKED") || bucket.slots[0];
      const avgBusy = bucket.busyScore / count;
      return {
        ...bucket,
        busyScore: avgBusy,
        demandScore: bucket.demandScore / count,
        futureBusy: bucket.futureBusy / count,
        statusScore: Math.max(avgBusy, 0.04),
        slot: {
          ...representativeSlot,
          time_slot: bucket.label.replace(/\./g, ":"),
          busy_score: avgBusy,
          demand_score: bucket.demandScore / count,
          future_busy: bucket.futureBusy / count,
          weather_blocked: Boolean(bucket.weather_blocked),
          status: bucket.weather_blocked ? "WEATHER_BLOCKED" : representativeSlot.status,
        },
      };
    });
  };

  const loadSchedule = useCallback(async () => {
    setGuestSchedule((await fetchGuestSchedule(guestId)) || []);
  }, [guestId]);

  const loadAnalytics = useCallback(async (clearMessage = true) => {
    const amenitiesToLoad = selectedAmenityList.filter(Boolean);
    if (!amenitiesToLoad.length) return;
    setLoading(true);
    if (clearMessage) {
      setEventMessage("Preparing analytics...");
      setAnalyticsByAmenity({});
      setSelectedSlotsByAmenity({});
    }
    try {
      for (const item of amenitiesToLoad) {
        const analyticsData = await fetchBusyAnalytics(propertyId, item, checkIn, checkOut);
        setAnalyticsByAmenity({ [item]: analyticsData.slots || [] });
      }
      await loadSchedule();
    } catch (err) {
      console.error(err);
      setEventMessage("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [propertyId, selectedAmenityList, checkIn, checkOut, loadSchedule]);

  const loadAnalyticsForAmenity = async (item) => {
    if (!item) return;
    setAmenity(item);
    setLoading(true);
    setEventMessage("");
    setAnalyticsByAmenity({});
    setSelectedSlotsByAmenity({});
    try {
      const analyticsData = await fetchBusyAnalytics(propertyId, item, checkIn, checkOut);
      setAnalyticsByAmenity({ [item]: analyticsData.slots || [] });
      await loadSchedule();
    } catch (err) {
      console.error(err);
      setEventMessage("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    const guest = await checkInGuest({
      guest_id: guestId,
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
      guest_id: guestId,
      property_id: propertyId,
      plan_your_stay_enabled: enabled,
      selected_amenities: selected,
    });
    setPlanEnabled(guest.plan_your_stay_enabled);
    setSelectedAmenities(guest.selected_amenities);
    if (guest.plan_your_stay_enabled) setShowConsentModal(false);
    setEventMessage(enabled ? "Smart Amenity Insights enabled." : "Smart Amenity Insights disabled.");
  };

  const handleEvent = async (slotId, eventType) => {
    try {
      const result = await postEvent(propertyId, slotId, eventType, guestId);
      if (result.success) {
        setActionStates((current) => ({
          ...current,
          [slotId]: eventType === "RESERVE"
            ? "RESERVED"
            : eventType === "CANCEL"
              ? "CANCELLED"
              : "WAITLISTED",
        }));
      }
      setEventMessage(result.message);
      await loadSchedule();
      await loadAnalytics(false);
    } catch (err) {
      console.error(err);
      setEventMessage("Event failed");
    }
  };

  const slotAction = (slot) => {
    if (slot.weather_blocked || slot.status === "WEATHER_BLOCKED") {
      return <span className="weather-blocked-badge">Might be cancelled - severe weather</span>;
    }
    if (slot.service_type === "open_window") {
      return <span className="open-window-badge">Open window - no reservation needed</span>;
    }
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
      <div className="bonvoy-page enterprise-bonvoy-page marriott-web-page">
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
            <div><span className="eyebrow">Upcoming Trip</span><h2>{tripPropertyName}</h2><p>Anaheim, California · {checkIn} - {checkOut}</p></div>
            <button onClick={(event) => { event.stopPropagation(); setView("booking"); }}>View Trip</button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="enterprise-page marriott-hotel-page marriott-web-page">
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
        <section className="hotel-booking-header">
          <div className="hotel-site-nav">
            <div className="hotel-brand-wordmark">Residence Inn <small>by Marriott</small></div>
            <nav aria-label="Hotel page navigation">
              <span className="active">Overview</span>
              <span>Gallery</span>
              <span>Accommodations</span>
              <span>Dining</span>
              <span>Experiences</span>
              <span>Events</span>
            </nav>
          </div>
          <div className="hotel-title-row">
            <h1>{tripPropertyName}</h1>
            <div className="hotel-rating-row" aria-label="Hotel rating and links">
              <span className="rating-dots">●●●●○</span>
              <span>4.2</span>
              <a href="#reviews">3090 Reviews</a>
              <span>📍 View Map</span>
              <span>☎ +1 714-782-7500</span>
            </div>
          </div>
          <div className="booking-summary-row">
            <div className="booking-summary-item date-summary-item">
              <span>Dates (1 Night)</span>
              <strong>{checkIn}</strong>
              <em>→</em>
              <strong>{checkOut}</strong>
            </div>
            <div className="booking-summary-item">
              <span>Rooms & Guests</span>
              <strong>1 Room, 1 Adult</strong>
            </div>
            <div className="booking-summary-item">
              <span>Special Rates</span>
              <strong>Lowest Regular Rate</strong>
            </div>
            <button className="view-rates-button" type="button">View Rates</button>
          </div>
        </section>

        <section className="marriott-overview-hero">
          <div className="overview-photo-main">
            <span>Residence Inn Anaheim Resort</span>
            <strong>Extended-stay suites near Disneyland Resort</strong>
          </div>
          <div className="overview-photo-stack">
            <div><span>Complimentary Breakfast</span></div>
            <div><span>Rooftop Pool & Hot Tub</span></div>
          </div>
        </section>

        <section className="marriott-welcome-section">
          <div>
            <span className="eyebrow">Welcome to {tripPropertyName}</span>
            <h2>Maintain your balance near Anaheim Resort and Convention Center</h2>
          </div>
          <p>
            Streamline your stay with spacious suites, full kitchens, free Wi‑Fi,
            complimentary hot breakfast, a rooftop pool and hot tub, a fitness
            center, and convenient access to Disneyland Resort and the Anaheim
            Convention Center.
          </p>
        </section>



        {!checkedIn && (
          <section className="enterprise-checkin-panel">
            <div className="control-group">
              <label htmlFor="guestName">Guest name</label>
              <input id="guestName" value={guestName} onChange={(event) => setGuestName(event.target.value)} />
            </div>
            <button className="black-btn" onClick={handleCheckIn}>Check In</button>
          </section>
        )}

        {checkedIn && !planEnabled && (
          <section className="enterprise-enable-panel">
            <h2>Smart Amenity Insights</h2>
            <p>Enable insights to unlock amenity metrics, waitlist actions, and recommendations.</p>
            <button className="black-btn" onClick={() => setShowConsentModal(true)}>Enable Feature</button>
          </section>
        )}

        <section className="featured-onsite-section enterprise-card">
              <div className="featured-onsite-heading">
                <h2>Featured Amenities On-Site</h2>
              </div>
              <div className="featured-onsite-tabs" role="tablist" aria-label="Amenities categories">
                {FEATURED_AMENITY_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    className={activeAmenityTab === tab.id ? "active" : ""}
                    onClick={() => setActiveAmenityTab(tab.id)}
                    role="tab"
                    type="button"
                    aria-selected={activeAmenityTab === tab.id}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
              <div className="featured-onsite-title-row">
                <h3>{featuredTitle}</h3>
                <span>⊙ included amenities (3)</span>
              </div>
              <div className="featured-onsite-grid">
                {featuredItems.map((item) => {
                  const enabled = item.amenity && amenityTypes.includes(item.amenity);
                  return (
                    <button
                      type="button"
                      key={`${activeAmenityTab}-${item.name}`}
                      className={`featured-onsite-item ${enabled && amenity === item.amenity ? "active" : ""}`}
                      disabled={!enabled}
                      onClick={() => enabled && loadAnalyticsForAmenity(item.amenity)}
                    >
                      <span className="featured-onsite-icon">{item.icon}</span>
                      <span className="featured-onsite-copy">
                        <strong>{item.name}{enabled ? " ⊙" : ""}</strong>
                        {item.detail && <small>{item.detail}</small>}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="featured-onsite-help">Select an available onsite amenity or service to view its analytics below.</p>
            </section>

        {checkedIn && planEnabled && (
          <>
            {loading && (
              <section className="enterprise-card analytics-loading-state">
                <strong>Loading analytics...</strong>
                <p>Preparing workbook-backed hourly metrics, demand, weather, traffic, and forecast details.</p>
              </section>
            )}

            {!loading && analyticsEntries.length === 0 && eventMessage && (
              <section className="enterprise-card analytics-empty-state">
                <strong>{eventMessage}</strong>
                <p>If this remains blank, confirm the URL uses a valid property such as <code>/MARRIOTT101/your-user</code>.</p>
              </section>
            )}

            {analyticsEntries.length > 0 && analyticsEntries.map(([amenityName, rows]) => (
              <section className="enterprise-card analytics-workspace" key={amenityName}>
                <div className="analytics-heading"><div><span className="eyebrow">Stay Range Metrics</span><h2>{amenityName}</h2><p>Hourly busy and demand metrics for the selected date are shown below as an onsite amenities analytics add-on.</p></div></div>
                <div className="enterprise-chart-frame">
                  <BarChart
                    width={Math.max(1400, chartDataFor(rows).length * 42)}
                    height={380}
                    data={chartDataFor(rows)}
                    margin={{ top: 18, right: 24, left: 8, bottom: 96 }}
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
                      interval={0}
                      minTickGap={0}
                      angle={-55}
                      textAnchor="end"
                      height={96}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis domain={[0, 1]} />
                    <Tooltip
                      formatter={(value, name) => [typeof value === "number" ? value.toFixed(2) : value, name]}
                      labelFormatter={(_label, payload) => {
                        const slot = payload?.[0]?.payload?.slot;
                        return slot ? `${slot.date} · ${formatTimeSlot(slot.time_slot)}` : _label;
                      }}
                    />
                    <Bar dataKey="statusScore" name="Slot Status" cursor="pointer" isAnimationActive={false} onClick={(data) => data?.slot && setSelectedSlotsByAmenity((current) => ({ ...current, [amenityName]: data.slot }))}>
                      {chartDataFor(rows).map((entry, index) => <Cell key={`${entry.date}-${entry.label}-${index}`} fill={statusColor(entry)} />)}
                    </Bar>
                  </BarChart>
                </div>
                <div className="chart-color-legend" aria-label="Histogram color legend">
                  <span><i className="legend-dot legend-green" />Green - availability / low busy</span>
                  <span><i className="legend-dot legend-yellow" />Yellow - moderate</span>
                  <span><i className="legend-dot legend-red" />Red - busy</span>
                  <span><i className="legend-dot legend-grey" />Grey - not available / weather impacted</span>
                </div>
                {selectedSlotsByAmenity[amenityName] ? (
                  <div className="slot-detail-card">
                    <div>
                      <span className="eyebrow">Selected hourly window</span>
                      <h3>{selectedSlotsByAmenity[amenityName].time_slot}</h3>
                      <p>{selectedSlotsByAmenity[amenityName].date} · {amenityName}</p>
                    </div>
                    <dl>
                      <div><dt>Busy</dt><dd>{scoreLevel(selectedSlotsByAmenity[amenityName].busy_score)}</dd></div>
                      <div><dt>Demand</dt><dd>{scoreLevel(selectedSlotsByAmenity[amenityName].demand_score)}</dd></div>
                      <div><dt>Forecast</dt><dd>{scoreLevel(selectedSlotsByAmenity[amenityName].future_busy)}</dd></div>
                      <div><dt>Season</dt><dd>{selectedSlotsByAmenity[amenityName].season || "spring"}</dd></div>
                      {selectedSlotsByAmenity[amenityName].seasonal_event && (
                        <div><dt>Seasonal Event</dt><dd>{selectedSlotsByAmenity[amenityName].seasonal_event}</dd></div>
                      )}
                      <div><dt>Weather</dt><dd>{selectedSlotsByAmenity[amenityName].weather_condition || "Clear"}</dd></div>
                      <div><dt>Traffic</dt><dd>{selectedSlotsByAmenity[amenityName].traffic_condition || "Light"}</dd></div>
                      <div><dt>Availability</dt><dd>{selectedSlotsByAmenity[amenityName].weather_blocked ? "Weather Blocked" : selectedSlotsByAmenity[amenityName].service_type === "open_window" ? "Open Window" : selectedSlotsByAmenity[amenityName].available <= 0 ? "Full" : `${selectedSlotsByAmenity[amenityName].available} open`}</dd></div>
                    </dl>
                    <div className="slot-detail-actions">{slotAction(selectedSlotsByAmenity[amenityName])}</div>
                    {eventMessage && !eventMessage.startsWith("Preparing") && (
                      <p className="slot-event-message">{eventMessage}</p>
                    )}
                    <div className="forecast-detail-note">
                      <strong>Forecast details</strong>
                      <p>{forecastSummary(selectedSlotsByAmenity[amenityName])}</p>
                      <small>Signals: busy {selectedSlotsByAmenity[amenityName].busy_score.toFixed(2)}, demand {selectedSlotsByAmenity[amenityName].demand_score.toFixed(2)}, weather {selectedSlotsByAmenity[amenityName].weather_condition || "clear"}, traffic {selectedSlotsByAmenity[amenityName].traffic_condition || "light"}{selectedSlotsByAmenity[amenityName].indoor_weather_boost ? ", indoor demand boosted by weather" : ""}.</small>
                      {selectedSlotsByAmenity[amenityName].weather_blocked && (
                        <small className="weather-impact-note">Outdoor activity might be cancelled due to severe weather forecast for this time period.</small>
                      )}
                      {selectedSlotsByAmenity[amenityName].weather_blocked && selectedSlotsByAmenity[amenityName].seasonal_event_impact && (
                        <small className="seasonal-impact-note">{selectedSlotsByAmenity[amenityName].seasonal_event_impact}</small>
                      )}
                    </div>
                  </div>
                ) : null}
                {eventMessage === "Failed to load analytics" && <p className="event-msg enterprise-event-msg">{eventMessage}</p>}
              </section>
            ))}
          </>
        )}


        <section className="marriott-content-band accommodations-band" id="accommodations">
          <div className="content-band-copy">
            <span className="eyebrow">Accommodations</span>
            <h2>Rest well in our all-suites hotel in Anaheim, CA</h2>
            <p>Make yourself at home in modern studio, one-bedroom and two-bedroom suites with separate living and sleeping areas, plush Marriott bedding, ergonomic workspaces, free Wi‑Fi and fully equipped kitchens.</p>
            <ul>
              <li>Full kitchens with refrigerator, stovetop, microwave and dishwasher</li>
              <li>Studio and family suite layouts for longer stays</li>
              <li>Workspaces and free Wi‑Fi for productivity</li>
            </ul>
          </div>
          <div className="content-band-media"><span>Suites with full kitchens</span></div>
        </section>

        <section className="marriott-content-band dining-band" id="dining">
          <div className="content-band-media"><span>Complimentary Breakfast in Anaheim</span></div>
          <div className="content-band-copy">
            <span className="eyebrow">Dining</span>
            <h2>Enjoy food and drinks offered at Residence Inn</h2>
            <p>Start with a satisfying complimentary hot breakfast, then unwind later at the Residence Inn Lobby Bar or explore nearby Anaheim dining options.</p>
            <ul>
              <li>Free Hot Breakfast: Monday-Friday 6:30 AM-9:30 AM</li>
              <li>Saturday-Sunday 7:00 AM-10:00 AM</li>
              <li>Residence Inn Lobby Bar for evening drinks</li>
            </ul>
          </div>
        </section>

        <section className="marriott-experience-section" id="experiences">
          <span className="eyebrow">Explore Anaheim</span>
          <h2>From theme parks to convention center stays, Anaheim has something for everyone</h2>
          <div className="experience-card-grid">
            <article><strong>Disneyland Resort</strong><p>Convenient access to Disneyland Resort, Disney California Adventure Park and Downtown Disney District.</p></article>
            <article><strong>Anaheim Convention Center</strong><p>Stay close to business events, group stays and convention travel.</p></article>
            <article><strong>Rooftop Pool</strong><p>Relax with pool, hot tub, splash zone and cabana-style amenities.</p></article>
          </div>
        </section>

        <section className="marriott-content-band events-band" id="events">
          <div className="content-band-copy">
            <span className="eyebrow">Meetings & Events</span>
            <h2>Stay together for groups and extended trips</h2>
            <p>Ask about group stays and room blocks when booking multiple rooms near Anaheim Resort and the Convention Center.</p>
          </div>
          <div className="content-band-media"><span>Book a Room Block</span></div>
        </section>

        <section className="bonvoy-app-promo">
          <div>
            <span className="eyebrow">Marriott Bonvoy App</span>
            <h2>Unlock your stay with the Marriott Bonvoy App</h2>
            <p>Use digital check-in, mobile key, service requests and amenity insights to plan your stay.</p>
          </div>
          <button className="black-btn" type="button">Explore App Features</button>
        </section>

        <footer className="marriott-footer">
          <strong>Residence Inn® by Marriott® at Anaheim Resort/Convention Center</strong>
          <span>Overview · Photos · Suites · Dining · Experiences · Events · Best Rate Guarantee</span>
        </footer>
      </main>
    </div>
  );
}
