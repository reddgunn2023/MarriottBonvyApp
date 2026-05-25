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
  fetchGuestSchedule,
  fetchProperties,
  fetchRecommendations,
  postEvent,
  saveGuestConsent,
} from "../services/amenityApi";
import "./BusyAnalyticsDashboard.css";

const DEFAULT_HOTEL_NAME = "Residence Inn at Anaheim Resort/Convention Center";
const IMPORTANT_AMENITIES = ["Free Breakfast", "Pool", "Fitness Center", "Lounges"];

function todayStr() {
  return "2026-03-26";
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

function scoreLevel(score) {
  if (score >= 0.7) return "High";
  if (score >= 0.4) return "Moderate";
  return "Low";
}

function forecastSummary(slot) {
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
    propertyId: propertyFromPath || "MARRIOTT101",
    guestId: userFromPath || "guest-default",
  };
}

export default function BusyAnalyticsDashboard() {
  const [{ propertyId, guestId }] = useState(routeContext);
  const [properties, setProperties] = useState([]);
  const [amenityTypes, setAmenityTypes] = useState([]);
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

  useEffect(() => {
    async function loadInitialData() {
      const loadedProperties = await fetchProperties();
      setProperties(loadedProperties);
      const loadedAmenityTypes = await fetchAmenityTypes(propertyId);
      const defaultSelected = IMPORTANT_AMENITIES.filter((item) => loadedAmenityTypes.includes(item));
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


  const selectedAmenityList = selectedAmenities.length ? selectedAmenities : amenityTypes;
  const analyticsEntries = Object.entries(analyticsByAmenity);
  const chartDataFor = (slots) => slots.map((slot) => ({
    label: formatTimeSlot(slot.time_slot),
    date: slot.date,
    statusScore: Math.max(slot.busy_score, 0.04),
    slot,
  }));

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
      setRecommendationsByAmenity({});
      setSelectedSlotsByAmenity({});
    }
    try {
      for (const item of amenitiesToLoad) {
        const [analyticsData, recData] = await Promise.all([
          fetchBusyAnalytics(propertyId, item, checkIn, checkOut),
          fetchRecommendations(propertyId, item, checkIn, checkOut),
        ]);
        setAnalyticsByAmenity((current) => ({
          ...current,
          [item]: analyticsData.slots || [],
        }));
        setRecommendationsByAmenity((current) => ({
          ...current,
          [item]: recData.recommendations || [],
        }));
        setEventMessage(`Loaded ${item} analytics.`);
      }
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
      const result = await postEvent(propertyId, slotId, eventType, guestId);
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

            {loading && (
              <section className="enterprise-card analytics-loading-state">
                <strong>Loading analytics...</strong>
                <p>Preparing workbook-backed 30-minute metrics, demand, weather, traffic, and forecast details.</p>
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
                <div className="analytics-heading"><div><span className="eyebrow">Stay Range Metrics</span><h2>{amenityName}</h2><p>Busy and demand metrics are shown in 30-minute intervals from check-in to checkout.</p></div></div>
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
                      {chartDataFor(rows).map((entry, index) => <Cell key={`${entry.date}-${entry.label}-${index}`} fill={busyColor(entry.statusScore)} />)}
                    </Bar>
                  </BarChart>
                </div>
                {selectedSlotsByAmenity[amenityName] ? (
                  <div className="slot-detail-card">
                    <div>
                      <span className="eyebrow">Selected 30-minute slot</span>
                      <h3>{selectedSlotsByAmenity[amenityName].time_slot}</h3>
                      <p>{selectedSlotsByAmenity[amenityName].date} · {amenityName}</p>
                    </div>
                    <dl>
                      <div><dt>Busy</dt><dd>{scoreLevel(selectedSlotsByAmenity[amenityName].busy_score)}</dd></div>
                      <div><dt>Demand</dt><dd>{scoreLevel(selectedSlotsByAmenity[amenityName].demand_score)}</dd></div>
                      <div><dt>Forecast</dt><dd>{scoreLevel(selectedSlotsByAmenity[amenityName].future_busy)}</dd></div>
                      <div><dt>Weather</dt><dd>{selectedSlotsByAmenity[amenityName].weather_condition || "Clear"}</dd></div>
                      <div><dt>Traffic</dt><dd>{selectedSlotsByAmenity[amenityName].traffic_condition || "Light"}</dd></div>
                      <div><dt>Availability</dt><dd>{selectedSlotsByAmenity[amenityName].available <= 0 ? "Full" : `${selectedSlotsByAmenity[amenityName].available} open`}</dd></div>
                    </dl>
                    <div className="slot-detail-actions">{slotAction(selectedSlotsByAmenity[amenityName])}</div>
                    <div className="forecast-detail-note">
                      <strong>Forecast details</strong>
                      <p>{forecastSummary(selectedSlotsByAmenity[amenityName])}</p>
                      <small>Signals: busy {selectedSlotsByAmenity[amenityName].busy_score.toFixed(2)}, demand {selectedSlotsByAmenity[amenityName].demand_score.toFixed(2)}, weather {selectedSlotsByAmenity[amenityName].weather_condition || "clear"}, traffic {selectedSlotsByAmenity[amenityName].traffic_condition || "light"}.</small>
                    </div>
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
