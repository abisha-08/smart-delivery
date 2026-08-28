-- UPS Smart Delivery & Delay Intelligence Platform Database Schema

CREATE TABLE IF NOT EXISTS hubs (
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

CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY,
  from_hub TEXT NOT NULL,
  to_hub TEXT NOT NULL,
  travel_time_minutes INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'NORMAL',
  delay_minutes INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS shipments (
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

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  type TEXT NOT NULL,
  shipment_id TEXT,
  message TEXT NOT NULL,
  source TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  synced INTEGER NOT NULL DEFAULT 0
);
