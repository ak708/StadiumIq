// Stadium Graph representation for MetLife Stadium
const STADIUM_GRAPH = {
  nodes: {
    'GATE_A': { label: 'Gate A Entrance' },
    'GATE_B': { label: 'Gate B Entrance' },
    'GATE_C': { label: 'Gate C Entrance' },
    'GATE_D': { label: 'Gate D Entrance' },
    'ZONE_B2': { label: 'Parking Zone B2' },
    'ZONE_A1': { label: 'Parking Zone A1' },
    'STAIRS_1': { label: 'Stairwell 1 (Gate A)' },
    'STAIRS_2': { label: 'Stairwell 2 (Gate B)' },
    'STAIRS_3': { label: 'Stairwell 3 (Gate C)' },
    'SECTION_112': { label: 'Section 112 (Lower Bowl)' },
    'SECTION_113': { label: 'Section 113 (Lower Bowl)' },
    'SECTION_215': { label: 'Section 215 (Mid Bowl)' },
    'FOOD_STAND_1': { label: 'Burger Stand (Near 112)' },
    'FOOD_STAND_2': { label: 'Hotdog Stand (Near 215)' },
  },
  edges: [
    // format: [nodeA, nodeB, baseCost]
    ['ZONE_A1', 'GATE_A', 5],
    ['ZONE_B2', 'GATE_B', 3],
    ['GATE_A', 'STAIRS_1', 2],
    ['GATE_B', 'STAIRS_2', 2],
    ['GATE_C', 'STAIRS_3', 2],
    ['GATE_A', 'GATE_B', 10], // Walk around concourse
    ['GATE_B', 'GATE_C', 10],
    ['STAIRS_1', 'SECTION_112', 4],
    ['STAIRS_1', 'SECTION_113', 6],
    ['STAIRS_2', 'SECTION_112', 5],
    ['STAIRS_3', 'SECTION_215', 7],
    ['SECTION_112', 'FOOD_STAND_1', 1],
    ['SECTION_215', 'FOOD_STAND_2', 1],
  ]
};

// Simple Dijkstra's Algorithm
function calculateOptimalRoute(startNodeId, endNodeId, currentHeatmap = {}) {
  const nodes = Object.keys(STADIUM_GRAPH.nodes);
  if (!nodes.includes(startNodeId) || !nodes.includes(endNodeId)) {
    return { error: 'Invalid start or end node.' };
  }

  const distances = {};
  const previous = {};
  const unvisited = new Set(nodes);

  nodes.forEach(node => {
    distances[node] = Infinity;
    previous[node] = null;
  });
  distances[startNodeId] = 0;

  while (unvisited.size > 0) {
    // Find node with minimum distance
    let minNode = null;
    let minDistance = Infinity;
    for (const node of unvisited) {
      if (distances[node] < minDistance) {
        minDistance = distances[node];
        minNode = node;
      }
    }

    if (minNode === null || minNode === endNodeId) {
      break;
    }

    unvisited.delete(minNode);

    // Get neighbors
    const edges = STADIUM_GRAPH.edges.filter(e => e[0] === minNode || e[1] === minNode);
    for (const edge of edges) {
      const neighbor = edge[0] === minNode ? edge[1] : edge[0];
      if (!unvisited.has(neighbor)) continue;

      let cost = edge[2];
      
      // Dynamic crowd flow modifier based on heatmap data!
      // If a node is highly congested (e.g., density > 80), increase the cost of edges connected to it drastically.
      if (currentHeatmap[neighbor]) {
         const density = currentHeatmap[neighbor].density;
         if (density > 80) cost += 50; // Major detour
         else if (density > 50) cost += 15; // Moderate slowdown
      }

      const alt = distances[minNode] + cost;
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        previous[neighbor] = minNode;
      }
    }
  }

  // Construct path
  const path = [];
  let curr = endNodeId;
  while (curr !== null) {
    path.unshift(curr);
    curr = previous[curr];
  }

  if (path[0] !== startNodeId) {
    return { error: 'No path found.' };
  }

  // Translate path into natural language descriptions
  const steps = path.map(nodeId => STADIUM_GRAPH.nodes[nodeId].label);
  
  return {
    path: path,
    steps: steps,
    totalDistanceWeight: distances[endNodeId],
    message: `Optimal route found. Estimated travel cost metric: ${distances[endNodeId]}.`
  };
}

module.exports = { STADIUM_GRAPH, calculateOptimalRoute };
