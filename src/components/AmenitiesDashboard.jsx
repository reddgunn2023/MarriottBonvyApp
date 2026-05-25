import { useState } from 'react'
import AmenityCard from './AmenityCard'
import { amenitiesData } from '../data/amenitiesData'
import './AmenitiesDashboard.css'

function AmenitiesDashboard() {
  const [filter, setFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const filtered = amenitiesData.filter((a) => {
    const statusMatch = filter === 'all' || a.status === filter
    const typeMatch = typeFilter === 'all' || a.type === typeFilter
    return statusMatch && typeMatch
  })

  const counts = {
    all: amenitiesData.length,
    available: amenitiesData.filter(a => a.status === 'available').length,
    moderate: amenitiesData.filter(a => a.status === 'moderate').length,
    busy: amenitiesData.filter(a => a.status === 'busy').length,
  }

  const totalWaiting = amenitiesData.reduce((sum, a) => sum + a.waitingQueue.length, 0)

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Amenities &amp; Services</h1>
          <p className="dashboard-subtitle">Real-time availability and booking for all hotel amenities</p>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-value">{amenitiesData.length}</span>
          <span className="stat-label">Total Amenities</span>
        </div>
        <div className="stat-card stat-available">
          <span className="stat-value">{counts.available}</span>
          <span className="stat-label">Available</span>
        </div>
        <div className="stat-card stat-moderate">
          <span className="stat-value">{counts.moderate}</span>
          <span className="stat-label">Moderate</span>
        </div>
        <div className="stat-card stat-busy">
          <span className="stat-value">{counts.busy}</span>
          <span className="stat-label">Busy</span>
        </div>
        <div className="stat-card stat-queue">
          <span className="stat-value">{totalWaiting}</span>
          <span className="stat-label">In Waitlist</span>
        </div>
      </div>

      <div className="dashboard-filters">
        <div className="filter-group">
          <span className="filter-label">Status:</span>
          {['all', 'available', 'moderate', 'busy'].map((s) => (
            <button
              key={s}
              className={`filter-btn ${filter === s ? 'active' : ''} ${s !== 'all' ? `filter-${s}` : ''}`}
              onClick={() => setFilter(s)}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              <span className="filter-count">{counts[s]}</span>
            </button>
          ))}
        </div>
        <div className="filter-group">
          <span className="filter-label">Type:</span>
          <button
            className={`filter-btn ${typeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTypeFilter('all')}
          >
            All Types
          </button>
          <button
            className={`filter-btn ${typeFilter === 'open_window' ? 'active' : ''}`}
            onClick={() => setTypeFilter('open_window')}
          >
            Open Window
          </button>
          <button
            className={`filter-btn ${typeFilter === 'time_slot' ? 'active' : ''}`}
            onClick={() => setTypeFilter('time_slot')}
          >
            Time Slot
          </button>
        </div>
      </div>

      <div className="amenities-list">
        {filtered.map((amenity) => (
          <AmenityCard key={amenity.id} amenity={amenity} />
        ))}
        {filtered.length === 0 && (
          <div className="no-results">
            <p>No amenities match the selected filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AmenitiesDashboard
