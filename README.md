# HappyRobot — Inbound Carrier Call Automation

A full-stack system for automating inbound carrier calls at a freight brokerage. Built for the HappyRobot FDE technical challenge.

An AI voice agent (deployed on HappyRobot's platform) handles live calls from carriers: verifies FMCSA authority, searches available loads, negotiates rates within configurable bounds, and transfers agreed bookings to sales. All call data flows into a real-time analytics dashboard.

---

## Live Deployments

| Service | URL |
|---|---|
| **Backend API** | `https://happyrobot-fde-production-e600.up.railway.app` |
| **API Docs (Swagger)** | `https://happyrobot-fde-production-e600.up.railway.app/docs` |
| **Dashboard** | Deployed on Vercel |

---

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌──────────────────────┐
│  Carrier Phone   │─────▶│  HappyRobot AI   │─────▶│  FastAPI Backend     │
│                  │      │  Voice Agent      │      │  (Railway — US)      │
└─────────────────┘      └──────────────────┘      └──────────┬───────────┘
                                                               │
                          ┌──────────────────┐      ┌──────────▼───────────┐
                          │  Next.js Dashboard│─────▶│  PostgreSQL          │
                          │  (Vercel)         │      │  (Supabase)          │
                          └──────────────────┘      └──────────────────────┘
```

**Call Flow:**
1. Carrier calls → HappyRobot AI agent answers as "Alex from Acme Logistics"
2. `verify_carrier` → FMCSA API checks MC number eligibility
3. `search_load` → Finds matching loads by lane & equipment (fuzzy search)
4. `evaluate_offer` → Rate negotiation engine (3 rounds, capped at +5% / +8% / +10%)
5. `transfer_to_sales` → Transfers call to a human sales rep upon agreement
6. Post-call → AI classifies sentiment & outcome, `POST /calls` records everything

---

## Features

### Backend (FastAPI + Python 3.11)
- **FMCSA Carrier Verification** — Real-time authority & safety rating check
- **Fuzzy Load Search** — Case-insensitive, partial match on origin/destination/equipment
- **Negotiation Engine** — Round-based rate evaluation with configurable caps
- **Auto-generated Call IDs** — `CALL-YYYYMMDD-XXX` format, no client-side ID needed
- **Robust Input Parsing** — Handles `null`, `"null"`, `""` from voice agent payloads
- **API Key Auth** — All endpoints protected via `X-API-Key` header
- **Rate Limiting** — 100 req/min via SlowAPI
- **Async PostgreSQL** — SQLAlchemy async + asyncpg with Supabase connection pooler

### Dashboard (Next.js 14 + TypeScript)
- **KPI Cards** — Total calls, booking rate, avg duration, avg negotiation rounds, rate delta, booked count
- **Charts** — Calls/day (line), outcome breakdown (donut), sentiment distribution (bar)
- **Top Lanes** — Most requested origin→destination pairs
- **Calls Log** — Filterable table with side drawer for call details
- **Load Inventory** — All loads with details
- **Authentication** — Cookie-based login with middleware protection
- **Server-side API Proxy** — Dashboard API routes call backend server-to-server (no CORS issues)

---

## API Endpoints

All endpoints require `X-API-Key` header except `/health` and `/docs`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/verify-carrier` | Verify carrier eligibility via FMCSA |
| `POST` | `/loads/search` | Search loads (JSON body: origin, destination, equipment_type) |
| `GET` | `/loads` | List loads (query params — used by dashboard) |
| `GET` | `/loads/{load_id}` | Get a single load by ID |
| `POST` | `/negotiations/evaluate` | Evaluate a carrier's rate offer |
| `POST` | `/calls` | Record a call (call_id auto-generated) |
| `GET` | `/calls` | List calls (filter: outcome, sentiment, date_from, date_to) |
| `GET` | `/metrics` | Aggregated dashboard metrics |

### Example: Verify Carrier
```bash
curl -X POST https://happyrobot-fde-production-e600.up.railway.app/verify-carrier \
  -H "X-API-Key: YOUR_KEY" -H "Content-Type: application/json" \
  -d '{"mc_number": "260913"}'
```

### Example: Search Loads
```bash
curl -X POST https://happyrobot-fde-production-e600.up.railway.app/loads/search \
  -H "X-API-Key: YOUR_KEY" -H "Content-Type: application/json" \
  -d '{"origin": "Chicago", "equipment_type": "dry van"}'
```

### Example: Evaluate Offer
```bash
curl -X POST https://happyrobot-fde-production-e600.up.railway.app/negotiations/evaluate \
  -H "X-API-Key: YOUR_KEY" -H "Content-Type: application/json" \
  -d '{"load_id": "LD-1001", "carrier_rate": 2600, "round": 1}'
```

---

## HappyRobot Agent Configuration

The agent uses 4 in-call tools + 1 post-call webhook:

| Tool | Type | Trigger |
|---|---|---|
| `verify_carrier` | API (POST) | Carrier provides MC number |
| `search_load` | API (POST) | Carrier specifies lane & equipment |
| `evaluate_offer` | API (POST) | Carrier proposes a rate |
| `transfer_to_sales` | Phone transfer | Rate agreed → transfer to sales rep |
| `Send Call Notification` | Webhook (POST) | Post-call → records call data |

Post-call AI pipeline: `classify_sentiment` → `extract_call_data` → `classify_outcome` → `Send Call Notification`

Full agent prompt and tool configuration: [`happyrobot_agent_prompt.md`](./happyrobot_agent_prompt.md)

---

## Tech Stack

| Component | Technology |
|---|---|
| Backend | Python 3.11, FastAPI, SQLAlchemy (async), asyncpg |
| Database | PostgreSQL (Supabase + PgBouncer connection pooler) |
| Dashboard | Next.js 14, TypeScript, Tailwind CSS, Recharts |
| Backend Hosting | Railway (US region) |
| Dashboard Hosting | Vercel |
| External APIs | FMCSA SAFER Web Services |

---

## Project Structure

```
├── backend/
│   ├── models/          # SQLAlchemy models (Load, Call)
│   ├── routers/         # FastAPI endpoints (carrier, loads, calls, negotiations, health)
│   ├── schemas/         # Pydantic request/response schemas
│   ├── services/        # Business logic (FMCSA verification, DB queries)
│   ├── config.py        # Environment settings
│   ├── database.py      # Async SQLAlchemy + SSL setup
│   ├── main.py          # FastAPI app, middleware, CORS
│   ├── seed.py          # Database seeding (12 loads + sample calls)
│   ├── Dockerfile
│   └── requirements.txt
├── dashboard/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (dashboard)/   # Protected pages (home, calls, loads)
│   │   │   ├── login/         # Login page
│   │   │   └── api/           # Server-side proxy routes
│   │   ├── components/        # Sidebar, charts, call drawer, UI
│   │   └── lib/               # Types, utilities
│   ├── middleware.ts           # Cookie-based auth guard
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml          # Local development setup
├── railway.toml                # Railway deployment config
├── happyrobot_agent_prompt.md  # Full agent prompt & tool config
└── README.md
```

---

## Local Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
# Set environment variables (DATABASE_URL, API_KEY, FMCSA_API_KEY)
python -m backend.seed
uvicorn backend.main:app --reload --port 8000
```

### Dashboard
```bash
cd dashboard
npm install
# Create .env.local with NEXT_PUBLIC_API_URL, NEXT_PUBLIC_API_KEY, DASHBOARD_PASSWORD
npm run dev
```

### Docker Compose (both services)
```bash
docker-compose up --build
```

---

## Environment Variables

### Backend
| Variable | Description |
|---|---|
| `API_KEY` | Secret key for API authentication |
| `FMCSA_API_KEY` | FMCSA SAFER Web Services key |
| `DATABASE_URL` | PostgreSQL connection string |
| `CORS_ORIGINS` | Allowed CORS origins |

### Dashboard
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_API_KEY` | API key for backend calls |
| `DASHBOARD_PASSWORD` | Password for dashboard login |
