import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts'
import { amenitiesData } from '../data/amenitiesData'
import './TrendCharts.css'

function TrendCharts() {
  const [selectedAmenity, setSelectedAmenity] = useState(null)

  const occupancySummary = amenitiesData.map((a) => ({
    name: a.name.length > 18 ? a.name.substring(0, 18) + '...' : a.name,
    fullName: a.name,
    occupancy: Math.round((a.currentOccupancy / a.maxCapacity) * 100),
    current: a.currentOccupancy,
    max: a.maxCapacity,
    status: a.status,
    waiting: a.waitingQueue.length,
  }))

  const waitlistSummary = amenitiesData
    .filter((a) => a.waitingQueue.length > 0)
    .map((a) => ({
      name: a.name.length > 18 ? a.name.substring(0, 18) + '...' : a.name,
      fullName: a.name,
      waiting: a.waitingQueue.length,
    }))

  const statusColor = {
    available: '#059669',
    moderate: '#D97706',
    busy: '#DC2626',
  }

  const selectedData = selectedAmenity
    ? amenitiesData.find((a) => a.id === selectedAmenity)
    : null

  return (
    <div className="trends">
      <div className="trends-header">
        <h1 className="trends-title">Amenity Trends &amp; Analytics</h1>
        <p className="trends-subtitle">
          Real-time occupancy trends, waitlist analysis, and demand patterns across all amenities
        </p>
      </div>

      <div className="trends-grid">
        <div className="trend-card trend-wide">
          <h3>Current Occupancy by Amenity</h3>
          <p className="trend-desc">Percentage of capacity currently in use</p>
          <div className="trend-chart">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={occupancySummary} margin={{ top: 10, right: 20, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  domain={[0, 100]}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    background: '#1B1B1B',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value, name, props) => [
                    `${value}% (${props.payload.current}/${props.payload.max})`,
                    'Occupancy',
                  ]}
                  labelFormatter={(label, payload) =>
                    payload?.[0]?.payload?.fullName || label
                  }
                />
                <Bar dataKey="occupancy" radius={[4, 4, 0, 0]} name="Occupancy %">
                  {occupancySummary.map((entry, idx) => (
                    <Cell key={idx} fill={statusColor[entry.status]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="trend-card">
          <h3>Waitlist by Amenity</h3>
          <p className="trend-desc">Guests currently in waiting queues</p>
          <div className="trend-chart">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={waitlistSummary} margin={{ top: 10, right: 20, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  height={60}
                />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: '#1B1B1B',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  labelFormatter={(label, payload) =>
                    payload?.[0]?.payload?.fullName || label
                  }
                />
                <Bar dataKey="waiting" fill="#B5985A" radius={[4, 4, 0, 0]} name="Guests Waiting" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="trend-card">
          <h3>Capacity Overview</h3>
          <p className="trend-desc">Current vs maximum capacity</p>
          <div className="trend-chart">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={occupancySummary} margin={{ top: 10, right: 20, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  height={60}
                />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={{
                    background: '#1B1B1B',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  labelFormatter={(label, payload) =>
                    payload?.[0]?.payload?.fullName || label
                  }
                />
                <Legend />
                <Bar dataKey="current" fill="#B5985A" radius={[4, 4, 0, 0]} name="Current" />
                <Bar dataKey="max" fill="#E5E7EB" radius={[4, 4, 0, 0]} name="Max Capacity" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="trend-card trend-full">
        <div className="hourly-header">
          <div>
            <h3>Hourly Occupancy Trend</h3>
            <p className="trend-desc">Select an amenity to view its hourly occupancy pattern</p>
          </div>
          <select
            className="amenity-select"
            value={selectedAmenity || ''}
            onChange={(e) => setSelectedAmenity(Number(e.target.value) || null)}
          >
            <option value="">Select amenity...</option>
            {amenitiesData.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {selectedData ? (
          <div className="trend-chart">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={selectedData.trendData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} unit="%" />
                <Tooltip
                  contentStyle={{
                    background: '#1B1B1B',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Bar dataKey="occupancy" fill="#B5985A" radius={[4, 4, 0, 0]} name="Occupancy %" />
                <Bar dataKey="waitList" fill="#DC2626" radius={[4, 4, 0, 0]} name="Wait List" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="no-selection">
            <p>Select an amenity above to view its hourly trend data</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TrendCharts
