# CARPE — Municipal Waste Management & Decision Intelligence Platform

CARPE is an enterprise-grade administrative and decision-intelligence platform engineered for municipal solid waste management, operational telemetry, geospatial monitoring, risk anomaly detection, predictive forecasting, and official government reporting.

---

## Architecture & Modules Overview

### 1. Operations & Logistics (Member 1)
- **Waste Collections**: Real-time logging of municipal waste intake by zone, waste type, volume (KG), vehicle, and collector.
- **Fleet & Vehicle Logistics**: Vehicle fleet management and capacity allocation.
- **Zone Infrastructure**: Municipal sector and zone registry with geographic coordinates.

### 2. Analytics & Decision Intelligence (Member 2)
- **Analytics Dashboard (`/analytics`)**:
  - 6 executive KPI cards (*Total Waste Volume*, *Daily Average Intake*, *Growth Rate %*, *Recyclable Fraction %*, *Peak Sector*, *Dominant Material*).
  - Chronological trend analysis via Recharts line visualizations.
  - Material stream donut distribution charts with interactive legends.
  - Municipal zone load rankings with dynamic progress share metrics.
  - Period-over-period growth intelligence cards.
- **Geospatial Monitoring Map (`/map`)**:
  - React-Leaflet interactive OpenStreetMap integration.
  - Proportional circle markers colored by priority risk tier (`HIGH` >1,000 KG, `MEDIUM` 500–1,000 KG, `LOW` $\le$500 KG).
  - Zone inspection popups and full telemetry summary table.
  - Automatic boundary fitting and missing coordinate handling.
- **Intelligent Waste Alerts (`/alerts`)**:
  - Automated detection of 4 critical risk typologies: *High Waste Growth* (>20%), *Material Stream Surges* (>15%), *Zone Hotspots* ($\ge$1,000 KG or $\ge$35% share), and *Sudden Volume Spikes* ($\ge$1.8x baseline average).
  - Deterministic fingerprinting preventing duplicate alerts.
  - Data transparency grids showing current volume, baseline previous volume, growth %, and actionable administrative recommendations.
- **AI Decision Intelligence (`/ai-insights`)**:
  - Automated decision-support synthesis based on structured analytics evidence.
  - Powered by Google Gemini (`gemini-1.5-flash`) with controlled prompting.
  - Built-in **Deterministic Policy Engine** fallback guaranteeing 100% operational uptime without requiring external API keys.
- **Predictive Waste Forecasting (`/forecast`)**:
  - Multi-horizon forecasting (7, 14, 30 days) using Linear Trend & Exponentially Weighted Moving Average (EWMA).
  - Historical actuals stitched to projected forecast line charts.
  - Data sufficiency safeguards and reliability tier classification (`HIGH`, `MEDIUM`, `LOW`).
- **Government Reports & Data Export (`/reports`)**:
  - 6 official report formats (*Summary*, *Collection Activity*, *Material Stream*, *Location Analysis*, *Alerts*, *Forecast*).
  - RFC-4180 compliant CSV Export.
  - Vector PDF generator powered by `jsPDF` and `jspdf-autotable`.

---

## Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React, Recharts, React-Leaflet, jsPDF, jspdf-autotable, Axios.
- **Backend**: Node.js, Express, Mongoose 9, JSON Web Token (JWT), bcryptjs, cors, dotenv.
- **Database**: MongoDB Atlas (Cloud) / In-Memory MongoDB Server for automated CI testing.

---

## Project Structure

```
CARPE/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx          # Stationary admin layout (Fixed Navbar & Sidebar)
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # User authentication state
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # Executive overview & active alerts feed
│   │   │   ├── Collections.jsx     # Waste collection log
│   │   │   ├── AddCollection.jsx   # New collection entry form
│   │   │   ├── Analytics.jsx       # Analytics & Decision Intelligence dashboard
│   │   │   ├── Map.jsx             # Geospatial telemetry monitoring map
│   │   │   ├── Alerts.jsx          # Operational alerts & risk detection
│   │   │   ├── AIInsights.jsx      # AI Decision Intelligence portal
│   │   │   ├── Forecast.jsx        # Predictive volume forecasting & planning
│   │   │   └── Reports.jsx         # Executive reports with PDF & CSV export
│   │   └── services/
│   │       └── api.js              # Configured Axios instance with JWT interceptor
│   ├── .env.example
│   └── package.json
├── server/
│   ├── controllers/
│   │   ├── analyticsController.js  # Analytics, growth, map, forecast, and report APIs
│   │   ├── alertsController.js     # Intelligent alerts retrieval & resolution
│   │   ├── aiInsightController.js  # AI decision intelligence controller
│   │   └── wasteController.js      # Collection CRUD operations
│   ├── models/
│   │   ├── Alert.js
│   │   ├── Location.js
│   │   ├── User.js
│   │   ├── Vehicle.js
│   │   └── WasteRecord.js
│   ├── routes/
│   │   ├── aiRoutes.js
│   │   ├── alertsRoutes.js
│   │   ├── analyticsRoutes.js
│   │   ├── authRoutes.js
│   │   ├── locationRoutes.js
│   │   ├── vehicleRoutes.js
│   │   └── wasteRoutes.js
│   ├── services/
│   │   ├── aiInsightService.js     # Structured AI prompting & deterministic policy engine
│   │   ├── alertService.js         # Mathematical anomaly detection algorithms
│   │   └── analyticsService.js     # MongoDB aggregation & regression forecast engine
│   ├── testRunner.js               # In-memory automated test suite
│   ├── .env.example
│   ├── server.js                   # Express application entrypoint
│   └── package.json
└── README.md
```

---

## Environment Variables Configuration

### 1. Backend (`server/.env`)
Create a `server/.env` file with the following parameters:
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_jwt_secret_key
AI_API_KEY=your_gemini_api_key_optional
CLIENT_URL=http://localhost:5173
```
*(Note: If `AI_API_KEY` is omitted or empty, the built-in Deterministic Policy Engine will automatically generate decision insights without errors.)*

### 2. Frontend (`client/.env`)
Create a `client/.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Installation & Running Locally

### Step 1: Install Dependencies
```powershell
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 2: Run Development Servers
Open two terminal windows:

**Terminal 1 (Backend Server on Port 5000):**
```powershell
cd server
npm run dev
```

**Terminal 2 (Frontend Client on Port 5173):**
```powershell
cd client
npm run dev
```

---

## Running Automated Test Suite
To run the automated integration test suite against an in-memory database:
```powershell
cd server
node testRunner.js
```
The test runner validates:
- Summary, Trend, Category, Location, and Growth aggregations.
- Geospatial coordinate joins and missing coordinate handling.
- Intelligent anomaly detection and priority weighting.
- AI decision intelligence and deterministic fallback engines.
- Linear regression forecasting across 7, 14, and 30-day horizons.
- Report compilation and collection pagination.
- Member 1 CRUD operations and auth security.

---

## API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/analytics/summary` | Consolidated executive metrics and top sectors |
| `GET` | `/api/analytics/trends` | Chronological collection trend line data |
| `GET` | `/api/analytics/categories` | Material stream quantities and composition % |
| `GET` | `/api/analytics/locations` | Municipal zone load analysis and risk levels |
| `GET` | `/api/analytics/growth` | Period-over-period volume growth intelligence |
| `GET` | `/api/analytics/map` | Geospatial markers joined with zone coordinates |
| `GET` | `/api/analytics/forecast` | Predictive volume forecast with EWMA trend |
| `GET` | `/api/analytics/reports` | Multi-type official administrative reports |
| `GET` | `/api/alerts` | Intelligent operational risk detection alerts |
| `PUT` | `/api/alerts/:id/resolve` | Mark active alert resolved |
| `POST` | `/api/ai/insights` | Generate AI decision support insights |

---

## Deployment Guidelines

### Frontend (Vercel)
1. Import repository and set root directory to `client`.
2. Framework Preset: **Vite**.
3. Environment Variable: `VITE_API_URL=https://your-backend-url.onrender.com/api`.
4. Build Command: `npm run build`. Output Directory: `dist`.

### Backend (Render / Railway)
1. Create a Web Service pointing to `server` directory.
2. Build Command: `npm install`.
3. Start Command: `node server.js`.
4. Environment Variables:
   - `PORT=5000`
   - `MONGO_URI=<MongoDB Atlas Connection String>`
   - `JWT_SECRET=<Secret Key>`
   - `CLIENT_URL=<Vercel Frontend URL>`
   - `AI_API_KEY=<Gemini API Key (Optional)>`

---

## Security & Compliance
- Environment files (`.env`) are strictly excluded via `.gitignore`.
- Authentication is enforced via JWT bearer tokens and `protect` middleware.
- Input validation sanitizes all date ranges and query parameters preventing injection or invalid range crashes.
