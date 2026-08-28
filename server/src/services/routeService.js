const { getDb } = require('../database/db');
const { findShortestPath } = require('../algorithms/dijkstra');

/**
 * Builds the current graph from the network routes table
 */
function buildNetworkGraph() {
  const db = getDb();
  const routes = db.prepare('SELECT * FROM routes').all();
  const graph = {};

  for (const route of routes) {
    const from = route.from_hub;
    const to = route.to_hub;
    // Edge weight includes baseline travel time + active delay on route
    const weight = Math.max(10, route.travel_time_minutes + (route.delay_minutes || 0));

    if (!graph[from]) graph[from] = [];
    if (!graph[to]) graph[to] = [];

    // Bi-directional connectivity in logistics network
    graph[from].push({ node: to, weight });
    graph[to].push({ node: from, weight });
  }

  return { graph, routes };
}

/**
 * Calculates the fastest path between two hubs using Dijkstra
 * @param {string} start - Origin or current location hub name
 * @param {string} destination - Target destination hub name
 * @returns {{ path: string[], travelTimeMinutes: number }}
 */
function calculateBestRoute(start, destination) {
  const { graph, routes } = buildNetworkGraph();
  const result = findShortestPath(graph, start, destination);

  // Compute baseline travel time along the calculated shortest path
  let baselineTime = 0;
  for (let i = 0; i < result.path.length - 1; i++) {
    const from = result.path[i];
    const to = result.path[i + 1];
    const r = routes.find(
      route => (route.from_hub === from && route.to_hub === to) || (route.from_hub === to && route.to_hub === from)
    );
    if (r) {
      baselineTime += r.travel_time_minutes;
    }
  }

  return {
    path: result.path,
    travelTimeMinutes: baselineTime || result.distance
  };
}

/**
 * Get all network hubs and routes for network visualization
 */
function getNetworkData() {
  const db = getDb();
  const hubs = db.prepare('SELECT * FROM hubs').all();
  const routes = db.prepare('SELECT * FROM routes').all();
  return { hubs, routes };
}

/**
 * Update route delay / status
 */
function updateRouteStatus(routeId, status, delayMinutes = 0) {
  const db = getDb();
  db.prepare('UPDATE routes SET status = ?, delay_minutes = ? WHERE id = ?').run(status, delayMinutes, routeId);
  return db.prepare('SELECT * FROM routes WHERE id = ?').get(routeId);
}

module.exports = {
  buildNetworkGraph,
  calculateBestRoute,
  getNetworkData,
  updateRouteStatus
};
