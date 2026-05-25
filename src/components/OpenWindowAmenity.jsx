import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './OpenWindowAmenity.css'

function OpenWindowAmenity({ amenity }) {
  const [selectedTime, setSelectedTime] = useState('')

  const handleTimeSubmit = () => {
    if (selectedTime) {
      alert(`Your preference for ${amenity.name} at ${selectedTime} has been recorded. This will be used to help optimize scheduling.`)
      setSelectedTime('')
    }
  }

  return (
    <div className="open-window">
      <div className="ow-section">
        <div className="ow-header">
          <h4>Operating Hours</h4>
          <span className="ow-hours">
            {amenity.operatingHours.open} - {amenity.operatingHours.close}
          </span>
        </div>
        <p className="ow-info">
          This is an <strong>open window</strong> amenity. No reservation needed &mdash;
          walk in anytime during operating hours. Your time preference helps us
          analyze demand patterns for future optimization.
        </p>
      </div>

      <div className="ow-section">
        <h4>Guest Demand by Hour</h4>
        <p className="ow-chart-desc">
          Preferred visiting times reported by guests (input for LLM training model)
        </p>
        <div className="ow-chart">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={amenity.preferredTimes} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: '#6B7280' }}
                interval={1}
              />
              <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} />
              <Tooltip
                contentStyle={{
                  background: '#1B1B1B',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Bar
                dataKey="count"
                fill="#B5985A"
                radius={[3, 3, 0, 0]}
                name="Guest Preferences"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="ow-section">
        <h4>Submit Your Preference</h4>
        <p className="ow-pref-desc">
          When would you prefer to visit? Your input contributes to our demand
          analysis model.
        </p>
        <div className="ow-pref-input">
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="ow-select"
          >
            <option value="">Select preferred time...</option>
            {amenity.preferredTimes.map((pt) => (
              <option key={pt.time} value={pt.time}>
                {pt.time} ({pt.count} guests interested)
              </option>
            ))}
          </select>
          <button
            className="ow-submit-btn"
            onClick={handleTimeSubmit}
            disabled={!selectedTime}
          >
            Submit Preference
          </button>
        </div>
      </div>
    </div>
  )
}

export default OpenWindowAmenity
