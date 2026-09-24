# Angular + Electron Telemetry Monitor

Windows desktop monitoring application built with **Angular 19**, **Electron**, and **TypeScript**. It displays real-time telemetry for Velocity, Pressure, and Temperature from a simulated backend controller.

## Features

- Real-time dashboard with circular gauges, live values, status indicators, and trend graphs
- Backend simulation via `GET /api/dashboard` (1-second updates, ±10% variation, drift correction every 5 cycles)
- Client-side unit conversion (no extra API calls)
- Light/Dark theme switching without reload
- CSV and Excel export
- Chart zoom, pan, and tooltips
- Connection, loading, and error states

## Project Structure

```
task/
├── backend/          # Express + TypeScript telemetry API
├── frontend/         # Angular dashboard application
├── electron/         # Electron main process
├── package.json      # Root scripts to run the full stack
└── README.md
```

## Prerequisites

- Node.js 18+ (tested with Node 24)
- npm 9+

## Setup Instructions

### 1. Install dependencies

From the project root:

```bash
npm install
npm run install:all
```

Or install each part separately:

```bash
npm install --prefix backend
npm install --prefix frontend
```

### 2. Run in development mode (recommended)

This starts the backend, Angular dev server, and Electron desktop window:

```bash
npm run dev
```

Services:
- Backend API: `http://localhost:3000/api/dashboard`
- Angular UI: `http://localhost:4200`

### 3. Run web-only (without Electron)

Terminal 1:

```bash
npm run backend
```

Terminal 2:

```bash
npm run frontend
```

Open `http://localhost:4200` in a browser.

### 4. Production desktop build

```bash
npm run start:prod
```

## Architecture & Technical Decisions

### Backend (Express + TypeScript)

- A singleton `TelemetrySimulator` generates values every second.
- Each sensor keeps the latest **100** history points in memory.
- Values vary randomly by about **10%**; every **5th** update drifts back toward base values.
- `GET /api/dashboard` returns the current snapshot in the required JSON format.

### Frontend (Angular)

- **TelemetryService** polls the API every second using RxJS `interval`.
- **UnitConversionService** converts values client-side for gauges, labels, and charts.
- **ThemeService** uses CSS variables and `data-theme` for instant theme switching.
- **ExportService** exports current telemetry snapshots to CSV/XLSX using `file-saver` and `xlsx`.
- Components are standalone for simpler structure and lazy-friendly architecture.

### Electron

- Loads the Angular dev server in development.
- Loads the built Angular app from `frontend/dist` in production.
- Context isolation enabled; Node integration disabled in the renderer.

### UI / Charts

- Custom SVG circular gauges for smooth value animation.
- Chart.js with zoom/pan plugin for live trend graphs.
- Responsive card layout with status coloring (Normal / Warning / Critical).

## Assumptions

1. Backend base units are **cm/s**, **mbar**, and **°C** (matching the sample response).
2. Status thresholds are configured in the frontend based on converted values:
   - Velocity: Normal 20–75 cm/s, Warning outside that range, Critical below 10 or above 90 cm/s
   - Pressure: Normal 970–1050 mbar, with warning/critical bands beyond that
   - Temperature: Normal 15–32 °C, with warning/critical bands beyond that
3. Export includes the latest collected history snapshot from the backend response.
4. Electron is used as the desktop shell; the same UI works in a browser for development.
5. CORS is enabled on the backend for local development.

## API Sample

`GET http://localhost:3000/api/dashboard`

```json
{
  "timestamp": "2024-07-22T11:10:05.000Z",
  "velocity": {
    "value": 45.2,
    "unit": "cm/s",
    "history": [{ "time": "11:10:01", "value": 44.8 }]
  },
  "pressure": {
    "value": 1013.25,
    "unit": "mbar",
    "history": [{ "time": "11:10:01", "value": 1012.8 }]
  },
  "temperature": {
    "value": 23.5,
    "unit": "°C",
    "history": [{ "time": "11:10:01", "value": 23.4 }]
  }
}
```

## Submission Notes

Exclude `node_modules/` and build output directories (`dist/`, `build/`) when submitting.
