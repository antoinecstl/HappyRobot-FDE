# HappyRobot — Inbound Carrier Call Automation

A full-stack system for automating inbound truck carrier calls at a freight brokerage, built for the HappyRobot technical challenge.

The **AI voice agent** (configured on HappyRobot's platform) handles calls from carriers looking to book loads. It verifies carrier eligibility, searches available loads, negotiates rates, and records call outcomes — all backed by this API and dashboard.

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Carrier Phone   │────▶│  HappyRobot AI   │────▶│  FastAPI Backend  │
│                  │     │  Voice Agent      │     │  (port 8000)      │
└─────────────────┘     └──────────────────┘     └────────┬─────────┘
                                                          │
                                                          ▼
                        ┌──────────────────┐     ┌──────────────────┐
                        │  Next.js Dashboard│────▶│  SQLite Database  │
                        │  (port 3000)      │     │                   │
                        └──────────────────┘     └──────────────────┘
```

## Features

### Backend (FastAPI)
- **Carrier Verification** — Real-time FMCSA API lookup by MC number
- **Load Search** — Fuzzy search on origin/destination, filter by equipment type
- **Call Recording** — Webhook endpoint for HappyRobot to log call outcomes
- **Metrics API** — Aggregated KPIs: booking rate, sentiment, outcomes, top lanes
- **Security** — API key auth, rate limiting (100 req/min), CORS

### Dashboard (Next.js 14)
- **Real-time KPIs** — Total calls, booking rate, avg negotiation rounds, rate delta
- **Charts** — Calls/day line chart, outcome donut, sentiment bar chart
- **Calls Log** — Filterable table with side drawer details
- **Load Inventory** — All loads with booked/available status
- **Dark Mode** — Professional freight/logistics aesthetic

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- An [FMCSA API key](https://mobile.fmcsa.dot.gov/QCDevsite/) (free)

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-username/happyrobot-carrier-automation.git
cd happyrobot-carrier-automation
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in:

| Variable | Description |
|---|---|
| `API_KEY` | Secret key for API authentication |
| `FMCSA_API_KEY` | Your FMCSA SAFER Web Services key |
| `DATABASE_URL` | SQLite connection string (default works) |
| `CORS_ORIGINS` | Allowed origins for CORS |
| `NEXT_PUBLIC_API_URL` | Backend URL for the dashboard |
| `NEXT_PUBLIC_API_KEY` | Same as `API_KEY` |

### 3. Start with Docker Compose

```bash
docker-compose up --build
```

This will:
1. Build and start the FastAPI backend on **port 8000**
2. Automatically seed the database with 12 loads and 35 call records
3. Build and start the Next.js dashboard on **port 3000**

### 4. Access the services

| Service | URL |
|---|---|
| Dashboard | [http://localhost:3000](http://localhost:3000) |
| API Docs (Swagger) | [http://localhost:8000/docs](http://localhost:8000/docs) |
| API Docs (ReDoc) | [http://localhost:8000/redoc](http://localhost:8000/redoc) |
| Health Check | [http://localhost:8000/health](http://localhost:8000/health) |

---

## Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env in project root with required vars
cd ..
python -m backend.seed    # Seed the database
uvicorn backend.main:app --reload --port 8000
```

### Dashboard

```bash
cd dashboard
npm install
npm run dev
```

---

## API Endpoints

All endpoints require `X-API-Key` header (except `/health` and docs).

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/verify-carrier` | Verify carrier by MC number via FMCSA |
| `GET` | `/loads` | Search loads (query: origin, destination, equipment_type, max_results) |
| `GET` | `/loads/{load_id}` | Get a single load |
| `POST` | `/calls` | Record a call (webhook from HappyRobot) |
| `GET` | `/calls` | List calls (filter: outcome, sentiment, date_from, date_to) |
| `GET` | `/metrics` | Aggregated dashboard metrics |

### Example: Verify a Carrier

```bash
curl -X POST http://localhost:8000/verify-carrier \
  -H "X-API-Key: your_secret_key_here" \
  -H "Content-Type: application/json" \
  -d '{"mc_number": "123456"}'
```

### Example: Search Loads

```bash
curl "http://localhost:8000/loads?origin=Chicago&equipment_type=Dry+Van&max_results=5" \
  -H "X-API-Key: your_secret_key_here"
```

---

## Configuring the HappyRobot Agent

1. **Create a new agent** on the HappyRobot platform
2. **Set the system prompt** using the contents of [`happyrobot_agent_prompt.md`](./happyrobot_agent_prompt.md)
3. **Configure webhook URLs** for the tools:

| Tool | Method | URL |
|---|---|---|
| Verify Carrier | POST | `https://your-domain.com/verify-carrier` |
| Search Loads | GET | `https://your-domain.com/loads?origin={origin}&destination={destination}&equipment_type={equipment_type}` |
| Get Load Details | GET | `https://your-domain.com/loads/{load_id}` |
| Record Call | POST | `https://your-domain.com/calls` |

4. **Add the API key** as a header in each webhook: `X-API-Key: your_secret_key_here`

---

## FMCSA API Key Setup

1. Visit [FMCSA QC Developer Site](https://mobile.fmcsa.dot.gov/QCDevsite/)
2. Register for a free account
3. Request a Web Services API key
4. Add the key to your `.env` as `FMCSA_API_KEY`

---

## Deployment

### Railway

1. Push to GitHub
2. Create a new project on [Railway](https://railway.app)
3. Add two services from the repo:
   - **Backend**: Set root directory to `/`, Dockerfile path to `backend/Dockerfile`
   - **Dashboard**: Set root directory to `/`, Dockerfile path to `dashboard/Dockerfile`
4. Add environment variables from `.env.example` to each service
5. Set `NEXT_PUBLIC_API_URL` to the backend's Railway URL
6. Railway will auto-deploy on push

### Fly.io

```bash
# Backend
cd backend
fly launch --name happyrobot-api --dockerfile Dockerfile
fly secrets set API_KEY=your_key FMCSA_API_KEY=your_key
fly deploy

# Dashboard
cd ../dashboard
fly launch --name happyrobot-dashboard --dockerfile Dockerfile
fly secrets set NEXT_PUBLIC_API_URL=https://happyrobot-api.fly.dev NEXT_PUBLIC_API_KEY=your_key
fly deploy
```

---

## Tech Stack

| Component | Technology |
|---|---|
| Backend | Python 3.11, FastAPI, SQLAlchemy (async), SQLite |
| Dashboard | Next.js 14, TypeScript, Tailwind CSS, Recharts |
| Infrastructure | Docker, Docker Compose |
| External APIs | FMCSA SAFER Web Services |

---

## Project Structure

```
├── backend/
│   ├── models/          # SQLAlchemy models
│   ├── routers/         # FastAPI route handlers
│   ├── schemas/         # Pydantic schemas
│   ├── services/        # Business logic (FMCSA, DB queries)
│   ├── config.py        # Settings & env vars
│   ├── database.py      # Async SQLAlchemy setup
│   ├── main.py          # FastAPI app & middleware
│   ├── seed.py          # Database seeding script
│   ├── Dockerfile
│   └── requirements.txt
├── dashboard/
│   ├── src/
│   │   ├── app/         # Next.js App Router pages
│   │   ├── components/  # React components
│   │   └── lib/         # Types, utilities
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── happyrobot_agent_prompt.md
├── .env.example
└── README.md
```
