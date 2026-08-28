/**
 * Real Dijkstra Shortest Path Algorithm
 *
 * Implements Dijkstra's algorithm to calculate the fastest path between hubs
 * in the logistics transportation network based on edge weights (travel times + delays).
 */

class PriorityQueue {
  constructor() {
    this.elements = [];
  }

  enqueue(element, priority) {
    this.elements.push({ element, priority });
    this.elements.sort((a, b) => a.priority - b.priority);
  }

  dequeue() {
    return this.elements.shift()?.element;
  }

  isEmpty() {
    return this.elements.length === 0;
  }
}

/**
 * Finds the shortest path in a weighted graph using Dijkstra's algorithm.
 *
 * @param {Object} graph - Adjacency list: { "Denver": [{ node: "Dallas", weight: 140 }, ...], ... }
 * @param {string} start - Origin hub name
 * @param {string} destination - Target hub name
 * @returns {{ path: string[], distance: number }}
 */
function findShortestPath(graph, start, destination) {
  if (!graph || !start || !destination) {
    return { path: [], distance: 0 };
  }

  if (start === destination) {
    return { path: [start], distance: 0 };
  }

  if (!graph[start] || !graph[destination]) {
    // If not directly represented or disconnected
    return { path: [start, destination], distance: 0 };
  }

  const distances = {};
  const previous = {};
  const pq = new PriorityQueue();

  // Initialize distances
  for (const node of Object.keys(graph)) {
    if (node === start) {
      distances[node] = 0;
      pq.enqueue(node, 0);
    } else {
      distances[node] = Infinity;
      pq.enqueue(node, Infinity);
    }
    previous[node] = null;
  }

  while (!pq.isEmpty()) {
    const current = pq.dequeue();

    if (current === destination) {
      break;
    }

    if (!current || distances[current] === Infinity) {
      continue;
    }

    const neighbors = graph[current] || [];
    for (const neighbor of neighbors) {
      const neighborNode = typeof neighbor === 'string' ? neighbor : neighbor.node;
      const weight = typeof neighbor === 'object' && neighbor.weight !== undefined ? neighbor.weight : 1;

      const alt = distances[current] + weight;
      if (alt < (distances[neighborNode] ?? Infinity)) {
        distances[neighborNode] = alt;
        previous[neighborNode] = current;
        pq.enqueue(neighborNode, alt);
      }
    }
  }

  // Reconstruct path
  const path = [];
  let curr = destination;

  if (distances[destination] === Infinity || !previous[curr] && curr !== start) {
    // No path found
    return { path: [start, destination], distance: 0 };
  }

  while (curr) {
    path.unshift(curr);
    curr = previous[curr];
  }

  return {
    path,
    distance: distances[destination] === Infinity ? 0 : distances[destination]
  };
}

module.exports = {
  findShortestPath,
  PriorityQueue
};
