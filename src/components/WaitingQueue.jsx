import './WaitingQueue.css'

function WaitingQueue({ queue, amenityName }) {
  return (
    <div className="waiting-queue">
      <div className="wq-header">
        <h4>Waiting Line</h4>
        <span className="wq-count">{queue.length} in queue</span>
      </div>

      <div className="wq-list">
        {queue.map((entry) => (
          <div key={entry.position} className="wq-entry">
            <div className="wq-position">
              <span className="wq-pos-number">#{entry.position}</span>
            </div>
            <div className="wq-details">
              <span className="wq-guest">{entry.guestName}</span>
              <span className="wq-room">{entry.room}</span>
            </div>
            <div className="wq-requested">
              <span className="wq-requested-label">Requested</span>
              <span className="wq-requested-time">{entry.requestedTime}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="wq-footer">
        <span className="wq-est">
          Est. wait: ~{queue.length * 15} min for {amenityName}
        </span>
      </div>
    </div>
  )
}

export default WaitingQueue
