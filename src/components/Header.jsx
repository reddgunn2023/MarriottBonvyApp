import { NavLink } from 'react-router-dom'
import { guestProfile } from '../data/amenitiesData'
import './Header.css'

function Header({ consentGiven }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <div className="header-logo">
            <span className="logo-m">M</span>
            <div className="logo-text">
              <span className="logo-marriott">MARRIOTT</span>
              <span className="logo-bonvoy">Bonvoy</span>
            </div>
          </div>
        </div>

        {consentGiven && (
          <nav className="header-nav">
            <NavLink to="/amenities" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Amenities
            </NavLink>
            <NavLink to="/trends" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Trends
            </NavLink>
          </nav>
        )}

        {consentGiven && (
          <div className="header-guest">
            <div className="guest-info">
              <span className="guest-name">{guestProfile.name}</span>
              <span className="guest-tier">{guestProfile.tier}</span>
            </div>
            <div className="guest-avatar">
              {guestProfile.name.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
