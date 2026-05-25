import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import CheckInConsent from './components/CheckInConsent'
import AmenitiesDashboard from './components/AmenitiesDashboard'
import TrendCharts from './components/TrendCharts'
import './App.css'

function App() {
  const [consentGiven, setConsentGiven] = useState(false)

  const handleConsentComplete = () => {
    setConsentGiven(true)
  }

  return (
    <div className="app">
      <Header consentGiven={consentGiven} />
      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              consentGiven
                ? <Navigate to="/amenities" replace />
                : <CheckInConsent onConsentComplete={handleConsentComplete} />
            }
          />
          <Route
            path="/amenities"
            element={
              consentGiven
                ? <AmenitiesDashboard />
                : <Navigate to="/" replace />
            }
          />
          <Route
            path="/trends"
            element={
              consentGiven
                ? <TrendCharts />
                : <Navigate to="/" replace />
            }
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
