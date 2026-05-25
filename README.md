# MarriottBonvyApp

A React-based Marriott Bonvoy amenities and services dashboard application. This app provides real-time visibility into hotel amenity availability, occupancy trends, and guest waiting queues — all presented with Marriott Bonvoy brand styling.

## Features

### 1. Guest Check-in & Consent Flow
- Multi-step check-in process with guest profile display
- Consent collection for amenity tracking, time preferences, waitlist notifications, and LLM training data contribution
- Required and optional consent options

### 2. Amenities Dashboard
- Real-time status labels: **Available**, **Moderate**, **Busy**
- Occupancy ring indicators showing current vs. maximum capacity
- Waiting line queue display with estimated wait times
- Filterable by status and amenity type

### 3. Two Amenity Types

#### Open Window
- Walk-in amenities with no reservation required (e.g., Pool, Gym, Kids Club)
- Guest time preference input for demand analysis
- Bar charts showing guest demand patterns by hour
- Preference data designed as input for LLM training models

#### Time Slot
- Reservation-based amenities (e.g., Spa, Restaurant, Golf Course)
- Visual slot grid showing available vs. booked time slots
- "Book Now" for open slots
- "Join Waitlist" for booked slots with queue position tracking

### 4. Trend Analytics (Bar Charts)
- **Current Occupancy by Amenity** — color-coded by status
- **Waitlist by Amenity** — guests currently in waiting queues
- **Capacity Overview** — current vs. maximum capacity comparison
- **Hourly Occupancy Trend** — per-amenity hourly occupancy and wait list data

## Tech Stack

- **React 19** with Vite
- **React Router** for navigation
- **Recharts** for bar chart visualizations
- **CSS** with Marriott Bonvoy design system (custom properties)

## Getting Started

```bash
npm install
npm run dev
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
