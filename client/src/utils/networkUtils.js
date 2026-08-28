/**
 * Logistics Network Utilities & Graph Calculation
 */

export const HUB_COORDINATES = {
  Chicago: { x: 520, y: 150, state: 'IL', label: 'Chicago Hub' },
  Detroit: { x: 700, y: 130, state: 'MI', label: 'Detroit Hub' },
  Denver: { x: 180, y: 260, state: 'CO', label: 'Denver Hub' },
  Dallas: { x: 440, y: 420, state: 'TX', label: 'Dallas Hub' },
  Houston: { x: 480, y: 530, state: 'TX', label: 'Houston Hub' }
};

export const BASELINE_ROUTES = [
  { from: 'Chicago', to: 'Detroit', travelTime: 120 },
  { from: 'Chicago', to: 'Denver', travelTime: 180 },
  { from: 'Chicago', to: 'Dallas', travelTime: 240 },
  { from: 'Detroit', to: 'Dallas', travelTime: 100 },
  { from: 'Denver', to: 'Dallas', travelTime: 140 },
  { from: 'Dallas', to: 'Houston', travelTime: 90 }
];

/**
 * Client-side Dijkstra implementation for offline route recalculation
 */
export function calculateClientDijkstra(start, destination, routes = []) {
  if (!start || !destination) return { path: [], distance: 0 };
  if (start === destination) return { path: [start], distance: 0 };

  const graph = {};
  const activeRoutes = routes.length > 0 ? routes : BASELINE_ROUTES;

  for (const r of activeRoutes) {
    const from = r.from_hub || r.from;
    const to = r.to_hub || r.to;
    const weight = (r.travel_time_minutes || r.travelTime || 100) + (r.delay_minutes || 0);

    if (!graph[from]) graph[from] = [];
    if (!graph[to]) graph[to] = [];

    graph[from].push({ node: to, weight });
    graph[to].push({ node: from, weight });
  }

  const distances = {};
  const previous = {};
  const unvisited = new Set(Object.keys(graph));

  for (const node of Object.keys(graph)) {
    distances[node] = node === start ? 0 : Infinity;
    previous[node] = null;
  }

  while (unvisited.size > 0) {
    let current = null;
    let minDistance = Infinity;

    for (const node of unvisited) {
      if (distances[node] < minDistance) {
        minDistance = distances[node];
        current = node;
      }
    }

    if (current === null || current === destination || distances[current] === Infinity) {
      break;
    }

    unvisited.delete(current);

    for (const neighbor of (graph[current] || [])) {
      if (!unvisited.has(neighbor.node)) continue;

      const alt = distances[current] + neighbor.weight;
      if (alt < distances[neighbor.node]) {
        distances[neighbor.node] = alt;
        previous[neighbor.node] = current;
      }
    }
  }

  const path = [];
  let curr = destination;
  while (curr) {
    path.unshift(curr);
    curr = previous[curr];
  }

  // Calculate baseline travel time along the calculated path
  let baselineTime = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    const r = activeRoutes.find(
      route => ((route.from_hub || route.from) === from && (route.to_hub || route.to) === to) ||
               ((route.from_hub || route.from) === to && (route.to_hub || route.to) === from)
    );
    if (r) {
      baselineTime += (r.travel_time_minutes || r.travelTime || 0);
    }
  }

  return {
    path,
    distance: baselineTime || (distances[destination] === Infinity ? 0 : distances[destination])
  };
}
