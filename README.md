# ♻️ CARPE

## Solid Waste Management Information & Decision Support System

**CARPE** is a digital solid waste management platform designed to help authorities monitor waste collection, analyze waste-generation patterns, track collection vehicles, visualize geographic waste data, and support data-driven decision making.

The platform is designed with a **government-oriented interface** for solid waste management operations across Tamil Nadu.

---

## 🏛️ About CARPE

Solid waste management requires continuous monitoring of collection activities, waste quantities, locations, vehicles, and changing waste-generation patterns.

CARPE brings these activities together into a centralized digital platform.

The system transforms raw waste collection data into meaningful information through:

- 📊 Analytics
- 🗺️ Geographic visualization
- 🚛 Vehicle monitoring
- 🔮 Waste forecasting
- 🤖 AI-powered insights
- 🚨 Alerts
- 📑 Reports
- 🌐 Tamil and English language support

The goal is to help waste-management authorities understand current operations and make better decisions based on collected data.

---

# ✨ Key Features

### 📊 Waste Collection Management

- Record waste collection details
- Track collection locations
- Record waste types and quantities
- Associate collections with vehicles
- View collection history
- Search and filter collection records

### 📈 Analytics & Decision Support

- Total waste collected
- Waste-category analysis
- Location-based analysis
- Collection trends
- Growth analysis
- Key performance indicators
- High-waste area identification

### 🗺️ Geographic Waste Monitoring

- Interactive map-based visualization
- Location-based waste monitoring
- Geographic representation of collection activity
- Dynamic detection of collection locations
- Waste-volume-based map indicators

### 🚛 Vehicle Management

- Track waste collection vehicles
- View vehicle collection activity
- Monitor total waste transported
- View collection history associated with vehicles

### 🔮 Waste Forecasting

- Analyze historical collection data
- Identify waste-generation trends
- Forecast future waste levels
- Support collection planning and resource allocation

### 🤖 AI Decision Insights

- Generate insights from waste data
- Identify unusual waste patterns
- Highlight high-priority areas
- Provide recommendations for collection planning

### 🚨 Alerts

- Detect significant changes in waste generation
- Identify high-waste locations
- Provide priority-based alerts
- Support proactive waste-management decisions

### 📑 Reports

- View waste-management summaries
- Analyze collection statistics
- Support operational reporting
- Provide data for planning and decision making

### 🌐 Multilingual Support

CARPE supports:

- 🇬🇧 English
- 🇮🇳 Tamil

The interface can be switched between languages to improve accessibility for users across Tamil Nadu.

---

# 🖥️ Application Preview

## 🇬🇧 Dashboard — English

The CARPE dashboard provides a centralized overview of waste-management operations, including key statistics, collection information, and decision-support data.

<img width="1918" height="1079" alt="Screenshot 2026-08-19 205226" src="https://github.com/user-attachments/assets/f5b377f8-c770-410e-b9a7-abf4ddfa5e5c" />


---

## 🇮🇳 — Tamil

CARPE also provides Tamil language support, allowing users to interact with the platform in Tamil.

<img width="1904" height="1066" alt="Screenshot 2026-08-19 205256" src="https://github.com/user-attachments/assets/bb74a639-dc94-46a5-aa5d-e2aecc9724d5" />

---

## 🗺️ Geographic Waste Monitoring

The geographic monitoring interface provides a map-based view of waste collection activity across different locations.

It helps authorities understand the geographic distribution of waste and identify areas requiring attention.
<img width="1919" height="1079" alt="Screenshot 2026-08-19 205356" src="https://github.com/user-attachments/assets/47011ab3-bdd2-4bcf-a400-feb2b3552d1a" />

---

# 🔄 System Workflow


```text
                    WASTE COLLECTION
                           │
                           ▼
                  Collection Data Entry
                           │
                           ▼
                     Express API
                           │
                           ▼
                       MongoDB
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
          Analytics      Mapping      Vehicles
              │            │            │
              └────────────┼────────────┘
                           │
                           ▼
                  Decision Intelligence
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
          Forecasting   AI Insights   Alerts
              │            │            │
              └────────────┼────────────┘
                           ▼
                   Decision Support
```

---

# 🏗️ System Architecture

```text
┌──────────────────────────────────────────────┐
│                CARPE PLATFORM                │
├──────────────────────────────────────────────┤
│                                              │
│              React Frontend                  │
│                                              │
│  Dashboard │ Collections │ Analytics │ Map  │
│  Vehicles  │ Forecast    │ AI Insights      │
│  Alerts    │ Reports     │                  │
│                                              │
└──────────────────────┬───────────────────────┘
                       │
                       │ REST APIs
                       ▼
┌──────────────────────────────────────────────┐
│              Node.js + Express               │
│                                              │
│ Authentication                              │
│ Waste Management APIs                        │
│ Analytics APIs                               │
│ Vehicle APIs                                 │
│ Map APIs                                     │
│ Forecasting & AI Services                    │
│ Alert Services                               │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│                 MongoDB Atlas                │
│                                              │
│ Users │ Waste Records │ Vehicles │ Alerts   │
│ Locations │ Analytics Data                   │
└──────────────────────────────────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

- React.js
- Vite
- JavaScript
- CSS
- Recharts
- React Leaflet
- Leaflet
- Axios

## Backend

- Node.js
- Express.js
- Mongoose
- REST APIs

## Database

- MongoDB
- MongoDB Atlas

## Maps

- Leaflet
- React Leaflet
- OpenStreetMap

## AI & Intelligence

- AI-powered insight generation
- Waste trend analysis
- Predictive forecasting
- Rule-based alerts

---

# 📁 Project Structure

```text
CARPE/
│
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── services/
│       ├── translations/
│       ├── App.jsx
│       └── index.css
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── scripts/
│   ├── test/
│   └── server.js
│
├── screenshots/
│   ├── dashboard-english.png
│   ├── dashboard-tamil.png
│   └── map.png
│
├── README.md
└── .gitignore
```

---

# 📊 Core Modules

| Module | Purpose |
|---|---|
| Dashboard | Overall waste-management overview |
| Collections | Manage and monitor waste collection records |
| Analytics | Analyze waste trends and categories |
| Map | Geographic waste monitoring |
| Vehicles | Monitor collection vehicles |
| Forecast | Predict future waste-generation patterns |
| AI Insights | Generate decision-support insights |
| Alerts | Identify important waste-management events |
| Reports | Generate operational summaries |
| Language | English and Tamil interface |

---

# 🔐 Authentication & Security

CARPE includes authentication and protected API access.

The system uses:

- User authentication
- Protected API routes
- Bearer token authorization
- Environment variables for sensitive configuration
- MongoDB connection through environment configuration

Sensitive credentials such as database URLs and API keys should never be committed to the repository.

---

# 🌐 Language Support

CARPE is designed to support both English and Tamil.

```text
English
   ↕
Language Switcher
   ↕
Tamil
```

The language system is designed so that interface elements, navigation, dashboards, and other supported content can be displayed according to the selected language.

---

# 🗺️ Geographic Intelligence

CARPE uses geographic visualization to understand waste collection patterns.

Collection records are associated with locations and can be represented on an interactive map.

The system can:

- Detect locations from collection data
- Aggregate waste by location
- Display collection activity geographically
- Identify high-waste areas
- Provide location-based decision support

---

# 🔮 Predictive Waste Forecasting

Historical waste collection records can be analyzed to identify trends and estimate future waste-generation levels.

Forecasting can help authorities with:

- Collection planning
- Vehicle allocation
- Workforce planning
- Resource allocation
- Identification of increasing waste trends

---

# 🤖 AI-Based Decision Support

CARPE uses collected waste data to generate meaningful insights.

For example:

```text
Plastic waste in Anna Nagar has increased significantly
compared with the previous period.

Recommendation:
Consider increasing collection frequency in this area.
```

The purpose of AI integration is to transform raw operational data into actionable recommendations.

---

# 🚨 Alert System

CARPE can identify important changes in waste-generation patterns.

Example:

```text
🚨 HIGH WASTE ALERT

Plastic waste has increased significantly
in a monitored location.

Priority: HIGH
```

These alerts can help authorities take action before waste-management issues become larger operational problems.

---

# 👥 Team Responsibilities

CARPE is developed as a collaborative full-stack project.

### Member 1 — Waste Collection & Operations

Responsible for:

- Collection management
- Waste record CRUD
- Collection history
- Vehicle integration
- Collection-related APIs
- Operational frontend

### Member 2 — Analytics & Decision Intelligence

Responsible for:

- Analytics dashboard
- Waste trends
- Category analysis
- Location analysis
- Forecasting
- AI insights
- Alerts
- Decision-support frontend and APIs

Both members contribute to frontend, backend integration, testing, and overall system development.

---

# 🚀 Getting Started

## 1. Clone the repository

```bash
git clone https://github.com/Gokila171205/CARPE.git
cd CARPE
```

## 2. Install frontend dependencies

```bash
cd client
npm install
```

## 3. Install backend dependencies

Open another terminal:

```bash
cd server
npm install
```

## 4. Configure environment variables

Create a `.env` file inside the `server` directory.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key
```

Do not commit the `.env` file to GitHub.

## 5. Start the backend

```bash
cd server
npm run dev
```

The server will run on:

```text
http://localhost:5000
```

## 6. Start the frontend

Open another terminal:

```bash
cd client
npm run dev
```

Then open the URL shown by Vite in your browser.

---

# 🧪 Testing

The backend contains test and verification scripts for important system functionality.

Examples include:

- Analytics testing
- Dynamic location testing
- Map integration testing
- Vehicle mapping testing
- Geocoding testing
- Atlas data verification

---

# 🎯 Project Objective

The primary objective of CARPE is to create a centralized digital platform that enables solid waste-management authorities to:

1. Monitor waste collection activities.
2. Analyze waste-generation patterns.
3. Track collection vehicles.
4. Visualize waste geographically.
5. Identify high-waste locations.
6. Forecast future waste-generation trends.
7. Receive decision-support insights.
8. Improve resource and collection planning.
9. Support multilingual access through English and Tamil.

---

# 🌱 Expected Impact

CARPE aims to contribute to more efficient and data-driven solid waste management by helping authorities move from manual monitoring toward centralized digital decision support.

### Expected benefits

- ♻️ Improved waste collection efficiency
- 📊 Better use of operational data
- 🗺️ Improved geographic monitoring
- 🚛 Better vehicle utilization
- 🔮 Proactive collection planning
- 🤖 Data-driven decision making
- 🚨 Faster identification of waste-management issues
- 🌐 Improved accessibility through Tamil language support

---

# 🏛️ Government-Oriented Design

CARPE follows a professional government-oriented design approach inspired by public-sector digital service portals.

The interface emphasizes:

- Clear information presentation
- Official government identity
- Structured navigation
- Accessibility
- Data transparency
- Decision-support information
- Tamil language accessibility

---

# 📌 Future Enhancements

Potential future improvements include:

- Real-time GPS tracking of collection vehicles
- IoT-based smart-bin integration
- Route optimization
- Mobile application for field workers
- Advanced machine-learning forecasting
- Automated report generation
- Real-time notifications
- Integration with additional municipal data sources
- Expanded Tamil-language coverage

---

# 🌍 Vision

> **To transform solid waste management through data, technology and intelligent decision support.**

CARPE aims to provide a unified digital environment where waste collection data can be transformed into actionable intelligence for better planning, monitoring and management.

---

# 📄 Project Status

**Status:** Active Development 🚧

CARPE is being developed as a full-stack solid waste management and decision-support platform.

---

## 👨‍💻 Developed By

**CARPE Development Team**

Solid Waste Management Information & Decision Support System

**Tamil Nadu, India 🇮🇳**
