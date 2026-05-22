import './TimeSlotAmenity.css'

function TimeSlotAmenity({ amenity }) {
  const availableCount = amenity.slots.filter(s => s.available).length
  const bookedCount = amenity.slots.length - availableCount

  const handleBook = (slot) => {
    alert(`Slot at ${slot.time} (${slot.duration}) has been booked for your room. You will receive a confirmation notification.`)
  }

  const handleJoinWaitlist = (slot) => {
    alert(`You have been added to the waiting list for ${slot.time}. Current position: ${amenity.waitingQueue.length + 1}`)
  }

  return (
    <div className="time-slot">
      <div className="ts-summary">
        <div className="ts-stat">
          <span className="ts-stat-number ts-available">{availableCount}</span>
          <span className="ts-stat-label">Available</span>
        </div>
        <div className="ts-stat">
          <span className="ts-stat-number ts-booked">{bookedCount}</span>
          <span className="ts-stat-label">Booked</span>
        </div>
        <div className="ts-stat">
          <span className="ts-stat-number ts-waiting">{amenity.waitingQueue.length}</span>
          <span className="ts-stat-label">In Queue</span>
        </div>
      </div>

      <div className="ts-slots-grid">
        {amenity.slots.map((slot) => (
          <div key={slot.id} className={`ts-slot ${slot.available ? 'available' : 'booked'}`}>
            <div className="ts-slot-info">
              <span className="ts-slot-time">{slot.time}</span>
              <span className="ts-slot-duration">{slot.duration}</span>
            </div>
            <div className="ts-slot-status">
              {slot.available ? (
                <>
                  <span className="ts-slot-badge available">Open</span>
                  <button className="ts-book-btn" onClick={() => handleBook(slot)}>
                    Book Now
                  </button>
                </>
              ) : (
                <>
                  <span className="ts-slot-badge booked">{slot.bookedBy}</span>
                  <button className="ts-waitlist-btn" onClick={() => handleJoinWaitlist(slot)}>
                    Join Waitlist
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TimeSlotAmenity
