import { useState } from 'react'
import OpenWindowAmenity from './OpenWindowAmenity'
import TimeSlotAmenity from './TimeSlotAmenity'
import WaitingQueue from './WaitingQueue'
import './AmenityCard.css'

function AmenityCard({ amenity }) {
  const [expanded, setExpanded] = useState(false)

  const statusLabel = {
    available: 'Available',
    moderate: 'Moderate',
    busy: 'Busy',
  }

  const occupancyPercent = Math.round((amenity.currentOccupancy / amenity.maxCapacity) * 100)

  return (
    <div className={`amenity-card ${expanded ? 'expanded' : ''}`}>
      <div className="amenity-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="amenity-info">
          <div className="amenity-title-row">
            <h3 className="amenity-name">{amenity.name}</h3>
            <span className={`status-badge status-${amenity.status}`}>
              {statusLabel[amenity.status]}
            </span>
          </div>
          <div className="amenity-meta">
            <span className="amenity-category">{amenity.category}</span>
            <span className="amenity-type-badge">
              {amenity.type === 'open_window' ? 'Open Window' : 'Time Slot'}
            </span>
          </div>
          <p className="amenity-desc">{amenity.description}</p>
        </div>

        <div className="amenity-occupancy">
          <div className="occupancy-ring">
            <svg viewBox="0 0 36 36" className="occupancy-svg">
              <path
                className="occupancy-bg"
                d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`occupancy-fill occupancy-${amenity.status}`}
                strokeDasharray={`${occupancyPercent}, 100`}
                d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="occupancy-text">
              <span className="occupancy-number">{occupancyPercent}%</span>
            </div>
          </div>
          <span className="occupancy-label">
            {amenity.currentOccupancy}/{amenity.maxCapacity}
          </span>
        </div>

        <button
          className="expand-btn"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? '\u25B2' : '\u25BC'}
        </button>
      </div>

      {expanded && (
        <div className="amenity-card-body">
          {amenity.type === 'open_window' ? (
            <OpenWindowAmenity amenity={amenity} />
          ) : (
            <TimeSlotAmenity amenity={amenity} />
          )}

          {amenity.waitingQueue.length > 0 && (
            <WaitingQueue queue={amenity.waitingQueue} amenityName={amenity.name} />
          )}
        </div>
      )}
    </div>
  )
}

export default AmenityCard
