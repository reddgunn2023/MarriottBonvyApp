import { useState } from 'react'
import { guestProfile } from '../data/amenitiesData'
import './CheckInConsent.css'

function CheckInConsent({ onConsentComplete }) {
  const [step, setStep] = useState(1)
  const [consents, setConsents] = useState({
    amenityTracking: false,
    timePreferences: false,
    waitlistNotifications: false,
    llmTraining: false,
  })

  const handleConsentChange = (key) => {
    setConsents(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const allRequired = consents.amenityTracking && consents.timePreferences

  const handleContinue = () => {
    if (step === 1) {
      setStep(2)
    } else if (step === 2 && allRequired) {
      setStep(3)
    }
  }

  const handleComplete = () => {
    onConsentComplete()
  }

  return (
    <div className="checkin-container">
      <div className="checkin-card">
        <div className="checkin-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-circle">1</div>
            <span>Welcome</span>
          </div>
          <div className="progress-line" />
          <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="step-circle">2</div>
            <span>Consent</span>
          </div>
          <div className="progress-line" />
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-circle">3</div>
            <span>Ready</span>
          </div>
        </div>

        {step === 1 && (
          <div className="checkin-step">
            <div className="welcome-icon">
              <span className="welcome-key">&#x1F511;</span>
            </div>
            <h1 className="checkin-title">Welcome to Marriott Bonvoy</h1>
            <p className="checkin-subtitle">Your personalized amenities experience awaits</p>

            <div className="guest-card">
              <div className="guest-card-header">
                <span className="guest-card-label">Guest Details</span>
                <span className="guest-card-tier">{guestProfile.tier}</span>
              </div>
              <div className="guest-card-body">
                <div className="guest-detail">
                  <span className="detail-label">Name</span>
                  <span className="detail-value">{guestProfile.name}</span>
                </div>
                <div className="guest-detail">
                  <span className="detail-label">Member ID</span>
                  <span className="detail-value">{guestProfile.memberId}</span>
                </div>
                <div className="guest-detail">
                  <span className="detail-label">Room</span>
                  <span className="detail-value">{guestProfile.room}</span>
                </div>
                <div className="guest-detail">
                  <span className="detail-label">Stay</span>
                  <span className="detail-value">{guestProfile.checkInDate} - {guestProfile.checkOutDate}</span>
                </div>
                <div className="guest-detail">
                  <span className="detail-label">Points</span>
                  <span className="detail-value points">{guestProfile.points.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <button className="btn-primary" onClick={handleContinue}>
              Continue to Check-in
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="checkin-step">
            <h2 className="checkin-title">Amenity Preferences &amp; Consent</h2>
            <p className="checkin-subtitle">
              To personalize your experience and help us serve you better,
              please review and accept the following permissions.
            </p>

            <div className="consent-list">
              <label className={`consent-item ${consents.amenityTracking ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={consents.amenityTracking}
                  onChange={() => handleConsentChange('amenityTracking')}
                />
                <div className="consent-content">
                  <div className="consent-header">
                    <span className="consent-title">Amenity Usage Tracking</span>
                    <span className="consent-required">Required</span>
                  </div>
                  <p className="consent-desc">
                    Allow us to track amenity occupancy and availability in real-time
                    to provide you with accurate busy/non-busy status and optimal visit times.
                  </p>
                </div>
              </label>

              <label className={`consent-item ${consents.timePreferences ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={consents.timePreferences}
                  onChange={() => handleConsentChange('timePreferences')}
                />
                <div className="consent-content">
                  <div className="consent-header">
                    <span className="consent-title">Time Preference Collection</span>
                    <span className="consent-required">Required</span>
                  </div>
                  <p className="consent-desc">
                    Share your preferred visiting times for open-window amenities.
                    This data helps us analyze demand patterns and improve scheduling.
                  </p>
                </div>
              </label>

              <label className={`consent-item ${consents.waitlistNotifications ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={consents.waitlistNotifications}
                  onChange={() => handleConsentChange('waitlistNotifications')}
                />
                <div className="consent-content">
                  <div className="consent-header">
                    <span className="consent-title">Waitlist Notifications</span>
                    <span className="consent-optional">Optional</span>
                  </div>
                  <p className="consent-desc">
                    Receive real-time notifications when your position in the waiting
                    line advances or a slot becomes available.
                  </p>
                </div>
              </label>

              <label className={`consent-item ${consents.llmTraining ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={consents.llmTraining}
                  onChange={() => handleConsentChange('llmTraining')}
                />
                <div className="consent-content">
                  <div className="consent-header">
                    <span className="consent-title">LLM Training Data Contribution</span>
                    <span className="consent-optional">Optional</span>
                  </div>
                  <p className="consent-desc">
                    Allow your anonymized time preferences from open-window amenities
                    to be used for training our AI recommendation engine for future guests.
                  </p>
                </div>
              </label>
            </div>

            <button
              className="btn-primary"
              onClick={handleContinue}
              disabled={!allRequired}
            >
              Accept &amp; Continue
            </button>
            {!allRequired && (
              <p className="consent-hint">Please accept all required permissions to continue</p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="checkin-step">
            <div className="success-icon">&#10003;</div>
            <h2 className="checkin-title">You&apos;re All Set!</h2>
            <p className="checkin-subtitle">
              Your check-in is complete. Explore available amenities,
              book time slots, and view real-time trends.
            </p>

            <div className="ready-features">
              <div className="ready-feature">
                <span className="feature-icon">&#128202;</span>
                <div>
                  <strong>Live Availability</strong>
                  <p>Real-time busy/non-busy status for all amenities</p>
                </div>
              </div>
              <div className="ready-feature">
                <span className="feature-icon">&#128337;</span>
                <div>
                  <strong>Smart Booking</strong>
                  <p>Book time slots or join waiting queues instantly</p>
                </div>
              </div>
              <div className="ready-feature">
                <span className="feature-icon">&#128200;</span>
                <div>
                  <strong>Trend Analysis</strong>
                  <p>View occupancy trends to plan your visit</p>
                </div>
              </div>
            </div>

            <button className="btn-primary" onClick={handleComplete}>
              Explore Amenities
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CheckInConsent
