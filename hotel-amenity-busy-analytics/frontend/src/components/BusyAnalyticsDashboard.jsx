import React, { useState, useEffect, useCallback } from "react";
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
  fetchProperties,
  fetchAmenityTypes,
  fetchBusyAnalytics,
  fetchRecommendations,
  postEvent,
} from "../services/amenityApi";
import "./BusyAnalyticsDashboard.css";

const BUSY_COLORS = {
  low: "#4caf50",
  medium: "#ff9800",
  high: "#f44336",
};

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
  const [checkIn, setCheckIn] = useState(todayStr());
  const [checkOut, setCheckOut] = useState(addDays(todayStr(), 3));
  const [analytics, setAnalytics] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [eventMessage, setEventMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    fetchProperties().then(setProperties).catch(console.error);
    fetchAmenityTypes().then(setAmenityTypes).catch(console.error);
  }, []);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setEventMessage("");
    try {
      const [analyticsData, recData] = await Promise.all([
        fetchBusyAnalytics(propertyId, amenity, checkIn, checkOut),
        fetchRecommendations(propertyId, amenity, checkIn, checkOut),
      ]);
      setAnalytics(analyticsData);
      setRecommendations(recData.recommendations || []);
      setSelectedDate(null);
      setSelectedSlot(null);
    } catch (err) {
      console.error(err);
      setEventMessage("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [propertyId, amenity, checkIn, checkOut]);

  const handleEvent = async (eventType) => {
    if (!selectedSlot) {
      setEventMessage("Select a slot first");
      return;
    }
    try {
      const result = await postEvent(selectedSlot, eventType);
      setEventMessage(result.message);
      await loadAnalytics();
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
            timeSlot: s.time_slot,
            busyScore: s.busy_score,
            demandScore: s.demand_score,
            available: s.available,
            booked: s.booked,
            capacity: s.capacity,
            slotId: s.slot_id,
            status: s.status,
          }))
      : [];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Hotel Amenity Busy Analytics</h1>
        <p className="subtitle">Marriott Bonvoy — Smart Scheduling</p>
      </header>

      {/* Controls */}
      <section className="controls">
        <div className="control-group">
          <label htmlFor="property">Property</label>
          <select
            id="property"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="checkin">Check-in</label>
          <input
            id="checkin"
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
          />
        </div>

        <div className="control-group">
          <label htmlFor="checkout">Check-out</label>
          <input
            id="checkout"
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
          />
        </div>

        <div className="control-group">
          <label htmlFor="amenity">Amenity</label>
          <select
            id="amenity"
            value={amenity}
            onChange={(e) => setAmenity(e.target.value)}
          >
            {amenityTypes.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <button
          className="btn btn-primary"
          onClick={loadAnalytics}
          disabled={loading}
        >
          {loading ? "Loading…" : "Get Busy Analytics"}
        </button>
      </section>

      {/* Date tabs */}
      {uniqueDates.length > 0 && (
        <section className="date-tabs">
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

      {/* Bar chart */}
      {chartData.length > 0 && (
        <section className="chart-section">
          <h2>
            Busy Heatmap — {amenity} on {selectedDate}
          </h2>
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
                {chartData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={busyColor(entry.busyScore)}
                    stroke={
                      selectedSlot === entry.slotId ? "#1a237e" : "transparent"
                    }
                    strokeWidth={selectedSlot === entry.slotId ? 3 : 0}
                  />
                ))}
              </Bar>
              <Bar dataKey="demandScore" name="Demand Score" fill="#42a5f5" />
            </BarChart>
          </ResponsiveContainer>

          {selectedSlot && (
            <div className="selected-info">
              <p>
                <strong>Selected:</strong> {selectedSlot}
              </p>
              {(() => {
                const s = chartData.find((c) => c.slotId === selectedSlot);
                return s ? (
                  <p>
                    Capacity: {s.capacity} | Booked: {s.booked} | Available:{" "}
                    {s.available} | Status: {s.status}
                  </p>
                ) : null;
              })()}
            </div>
          )}

          {/* Booking actions */}
          <div className="actions">
            <button
              className="btn btn-reserve"
              onClick={() => handleEvent("RESERVE")}
            >
              Reserve
            </button>
            <button
              className="btn btn-cancel"
              onClick={() => handleEvent("CANCEL")}
            >
              Cancel
            </button>
            <button
              className="btn btn-waitlist"
              onClick={() => handleEvent("WAITLIST")}
            >
              Join Waitlist
            </button>
          </div>

          {eventMessage && <p className="event-msg">{eventMessage}</p>}
        </section>
      )}

      {/* Smart Recommendations */}
      {recommendations.length > 0 && (
        <section className="recommendations">
          <h2>Smart Recommendations</h2>
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
                  style={{ color: busyColor(rec.busy_score) }}
                >
                  Busy: {(rec.busy_score * 100).toFixed(0)}%
                </div>
                <p className="rec-reason">{rec.reason}</p>
                <p className="rec-avail">{rec.available} spots available</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
