# UPS Smart Delivery & Delay Intelligence Platform

A logistics operations command center that helps dispatchers monitor package movement, identify shipments at risk of missing delivery deadlines before SLA breaches occur, dynamically recalculate fastest alternative routes using Dijkstra's algorithm, ingest simulated legacy/RFID streams, and continue operating uninterrupted when network connectivity is lost.

---

## 1. Project Overview & Problem Solved

### The Problem
In high-throughput enterprise logistics networks, unpredictable disruptions (highway congestion, sorting bottlenecks, weather events) cause shipments to fall behind committed delivery deadlines. Legacy scanning systems often alert operators only after deadlines have already failed, and field workstations frequently lose connectivity during outages, causing operational downtime.

### The Solution
The **UPS Smart Delivery & Delay Intelligence Platform** provides an operational command center that:
1. **Tracks Packages in Real-Time** across major hubs (Chicago, Detroit, Denver, Dallas, Houston).
2. **Detects Deadline Risks Automatically** via an authoritative Risk Engine comparing dynamic ETAs against committed customer deadlines.
3. **Recalculates Optimal Paths via Real Dijkstra Algorithm** to route around congested corridors in real-time.
4. **Operates Offline with Queued Sync** utilizing local browser storage and seamless reconciliation to backend SQLite upon reconnection.
5. **Normalizes Legacy RFID / Message Queue Feeds** into a structured, responsive event stream.

---

## 2. Architecture & Tech Stack

```
                    REACT FRONTEND (Vite + JavaScript + CSS + Lucide)
                                          │
                                          │ REST API
                                          ▼
                         EXPRESS BACKEND (Node.js)
                                          │
          ┌───────────────────────────────┼──────────────────────────────┐
          │                               │                              │
   Shipment Service                  Risk Service                  Route Service
   (CRUD & Status)             (Authoritative Engine)          (Dijkstra Algorithm)
          │                               │                              │
          └───────────────────────────────┼──────────────────────────────┘
                                          │
                                    Event Service
                                          │
                                    Sync Service
                                          │
                                  SQLite Database
                                 (better-sqlite3)
                                          │
          ┌───────────────┬───────────────┴───────────────┬──────────────┐
          │               │                               │              │
      shipments         hubs                           routes          events
                                                                         │
                                                                    sync_queue
```

### Offline & Resilience Architecture:
```
React Client
  │
  ├──► LocalStorage Cache (Shipments, Network, Events, Stats)
  │
  └──► Pending Action Queue (DELAY_EVENT, ROUTE_UPDATE, PACKAGE_EVENT)
            │
      [Connection Restored / "Simulate Online"]
            │
            ▼
      POST /api/sync
            │
      Reconciled to SQLite + Server Audit Log
```

### Tech Stack:
- **Frontend**: React 19, Vite, JavaScript, Native SVG network visualization, CSS variables, `lucide-react`.
- **Backend**: Node.js, Express.
- **Database**: SQLite with `better-sqlite3` driver (WAL journal mode enabled).
- **Algorithms**: Real Dijkstra Shortest Path implementation (`dijkstra.js`).

---

## 3. Database Schema

The SQLite database (`server/ups_logistics.db`) contains 5 core tables:

```sql
CREATE TABLE hubs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPERATIONAL',
  package_count INTEGER NOT NULL DEFAULT 0,
  inbound_count INTEGER NOT NULL DEFAULT 0,
  outbound_count INTEGER NOT NULL DEFAULT 0,
  x_pos REAL NOT NULL,
  y_pos REAL NOT NULL
);

CREATE TABLE routes (
  id TEXT PRIMARY KEY,
  from_hub TEXT NOT NULL,
  to_hub TEXT NOT NULL,
  travel_time_minutes INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'NORMAL',
  delay_minutes INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE shipments (
  id TEXT PRIMARY KEY,
  tracking_number TEXT UNIQUE NOT NULL,
  origin TEXT NOT NULL,
  current_location TEXT NOT NULL,
  destination TEXT NOT NULL,
  eta TEXT NOT NULL,
  deadline TEXT NOT NULL,
  delay_minutes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ON_TRACK',
  route_json TEXT NOT NULL,
  recommended_route_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE events (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  type TEXT NOT NULL,
  shipment_id TEXT,
  message TEXT NOT NULL,
  source TEXT NOT NULL
);

CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  synced INTEGER NOT NULL DEFAULT 0
);
```

---

## 4. REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend and database health status |
| `GET` | `/api/stats` | Dynamic KPIs (`activeShipments`, `atRisk`, `inTransit`, `delayed`) |
| `GET` | `/api/shipments` | List all active shipments with computed statuses |
| `GET` | `/api/shipments/:id` | Get single shipment by ID or tracking number |
| `POST` | `/api/shipments/:id/delay` | Simulate delay (+20m), recalculate risk, emit `DELAY_EVENT` |
| `POST` | `/api/shipments/:id/recalculate` | Execute Dijkstra shortest path and return recommended route |
| `POST` | `/api/shipments/:id/apply-route` | Apply recommended route to shipment, optimize ETA, emit `ROUTE_UPDATE` |
| `GET` | `/api/network` | Get network topology (hubs and routes) |
| `GET` | `/api/events` | Query live legacy events stream |
| `POST` | `/api/events` | Create a system or RFID event |
| `POST` | `/api/sync` | Reconcile queued offline operations in batch to SQLite |
| `POST` | `/api/simulation/start` | Start live background RFID/legacy event generator |
| `POST` | `/api/simulation/stop` | Pause live background event generator |
| `GET` | `/api/simulation/status` | Inquire live simulation status |
| `POST` | `/api/reset-demo` | Restore SQLite seed data and pristine demo state |

---

## 5. Dijkstra Algorithm Implementation

The route recalculation engine (`server/src/algorithms/dijkstra.js`) implements real Dijkstra shortest path calculation on the logistics graph:
- **Nodes**: Network Hubs (`Chicago`, `Detroit`, `Denver`, `Dallas`, `Houston`).
- **Edge Weights**: Effective transit time = `travel_time_minutes + delay_minutes`.
- **Function**: `findShortestPath(graph, start, destination)` returns `{ path: [...], distance: number }`.

**Example:**
For `UPS1002` currently at `Denver` with destination `Houston`:
```javascript
findShortestPath(graph, "Denver", "Houston")
// Returns:
// {
//   path: ["Denver", "Dallas", "Houston"],
//   distance: 230
// }
```

---

## 6. Offline Architecture & Local Queue

1. **Detection**: Listens to browser events (`online`, `offline`) and `/api/health` connectivity.
2. **Simulate Offline**: A dedicated header button **`SIMULATE OFFLINE`** allows instant demonstration without pulling physical network cords.
3. **Local Action Queue**: Any write action taken while offline (e.g. simulating a delay or applying a Dijkstra route) immediately updates local state, creates local events, and records an action in `localStorage`.
4. **Synchronization**: Clicking **`SIMULATE ONLINE`** or reconnecting triggers `POST /api/sync`, executing pending actions in order and refreshing the local cache from SQLite.

---

## 7. How to Run

### Installation & Startup

```bash
# 1. Install all dependencies (root, server, and client)
npm run install:all

# 2. Start both backend and frontend concurrently
npm run dev
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 8. 5-Minute Judge Demonstration Flow

Follow this exact flow for a 5-minute hackathon judge demo:

1. **Dashboard Overview (30s)**:
   - Open [http://localhost:5173](http://localhost:5173).
   - Point out the 4 dynamic KPI cards (`ACTIVE SHIPMENTS: 12`, `AT RISK: 3`, `IN TRANSIT: 11`, `DELAYED: 2`).
   - Highlight the interactive SVG network showing hub package densities and corridor statuses.
2. **Inspect At-Risk Shipment (45s)**:
   - In the right-hand **At-Risk Shipments** panel, click **VIEW** on `UPS1002` (`Denver → Houston`, ETA 16:45 vs Deadline 16:30, +15m behind).
   - The slide-over drawer opens showing the current corridor and event timeline.
3. **Simulate Delay (45s)**:
   - Click **`SIMULATE DELAY (+20 min)`**.
   - Notice ETA updates to `17:05`, delay rises to `+35 min`, and status instantly transitions from `AT RISK` to `DELAYED`.
   - A `DELAY_EVENT` appears in the timeline.
4. **Dijkstra Route Recalculation (45s)**:
   - Click **`RECALCULATE FASTEST ROUTE`**.
   - Watch the loading state (`Analyzing network...`), which calls the Dijkstra algorithm and renders the **Fastest Available Route** (`Denver → Dallas → Houston`, `230 min`).
5. **Apply Route (30s)**:
   - Click **`APPLY ROUTE`**.
   - The route is applied, ETA is optimized, and a `ROUTE_UPDATE` event is broadcasted.
6. **Live RFID & Legacy Simulation (45s)**:
   - Navigate to **Live Events** in the sidebar.
   - Toggle **`SIMULATION: ACTIVE`** in the header.
   - Watch live RFID scans, hub queue transfers, and arrival notices ingest into the feed.
7. **Offline Mode & Synchronization (45s)**:
   - Click **`SIMULATE OFFLINE`** in the header.
   - The top banner turns amber (`⚠ OFFLINE MODE`).
   - Open a shipment and click **`SIMULATE DELAY`**.
   - Notice the badge says `Pending Sync: 1` and the UI stays completely responsive.
   - Click **`SIMULATE ONLINE`**.
   - Watch the banner show `✓ SYNC COMPLETE` as the queued action reconciles into SQLite.
8. **Reset Demo**:
   - Go to **Settings** and click **`RESET DEMO DATA`** to return the entire system to its pristine initial state anytime.
#   s m a r t - d e l i v e r y  
 