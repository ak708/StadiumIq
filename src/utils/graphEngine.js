// A basic implementation of a Stadium Knowledge Graph

export const STADIUM_GRAPH = {
  nodes: {
    // Gates
    'GATE_A': { type: 'GATE', label: 'Gate A Entrance', location: 'North' },
    'GATE_B': { type: 'GATE', label: 'Gate B Entrance', location: 'East' },
    'GATE_C': { type: 'GATE', label: 'Gate C Entrance', location: 'South' },
    'GATE_D': { type: 'GATE', label: 'Gate D Entrance', location: 'West' },
    
    // Food Stands
    'FOOD_A': { type: 'FIND_FOOD', label: 'Gate A Food Court', description: 'Burgers, Hot Dogs, Drinks' },
    'FOOD_B': { type: 'FIND_FOOD', label: 'Gate B Snack Bar', description: 'Pretzels, Drinks' },
    'FOOD_C': { type: 'FIND_FOOD', label: 'Gate C Premium Dining', description: 'Restaurant, Bar' },
    
    // Medical Stations
    'MED_A': { type: 'FIND_MEDICAL', label: 'First Aid North (Gate A)', description: 'Basic First Aid' },
    'MED_C': { type: 'FIND_MEDICAL', label: 'Medical Center South (Gate C)', description: 'Advanced Care' },
    
    // Parking
    'PARKING_A1': { type: 'FIND_PARKING', label: 'Zone A1 Parking', capacity: 50 },
    'PARKING_B1': { type: 'FIND_PARKING', label: 'Zone B1 Parking (Accessible)', capacity: 20 },
    
    // Sections (Sample)
    'SEC_112': { type: 'SECTION', label: 'Section 112', location: 'Level 2' },
    'SEC_113': { type: 'SECTION', label: 'Section 113', location: 'Level 2' },
  },
  
  // Distances in meters
  edges: [
    { from: 'GATE_A', to: 'FOOD_A', weight: 20 },
    { from: 'GATE_A', to: 'MED_A', weight: 50 },
    { from: 'GATE_A', to: 'PARKING_A1', weight: 150 },
    { from: 'GATE_A', to: 'GATE_B', weight: 200 },
    
    { from: 'GATE_B', to: 'FOOD_B', weight: 15 },
    { from: 'GATE_B', to: 'PARKING_B1', weight: 100 },
    { from: 'GATE_B', to: 'GATE_C', weight: 200 },
    
    { from: 'GATE_C', to: 'FOOD_C', weight: 30 },
    { from: 'GATE_C', to: 'MED_C', weight: 10 },
    { from: 'GATE_C', to: 'SEC_112', weight: 80 },
    { from: 'GATE_C', to: 'SEC_113', weight: 90 },
    { from: 'GATE_C', to: 'GATE_D', weight: 200 },
    
    { from: 'GATE_D', to: 'GATE_A', weight: 200 },
  ]
};

// Create adjacency list for Dijkstra
function buildAdjacencyList(graph) {
  const adj = {};
  for (const nodeId in graph.nodes) {
    adj[nodeId] = [];
  }
  for (const edge of graph.edges) {
    if (adj[edge.from] && adj[edge.to]) {
      adj[edge.from].push({ node: edge.to, weight: edge.weight });
      adj[edge.to].push({ node: edge.from, weight: edge.weight }); // undirected
    }
  }
  return adj;
}

export function findNearestNodeOfType(graph, startNodeId, targetType) {
  if (!graph.nodes[startNodeId]) {
    return { error: 'Start node not found in graph' };
  }

  const adj = buildAdjacencyList(graph);
  const distances = {};
  const previous = {};
  const queue = new Set(Object.keys(graph.nodes));

  for (const node of queue) {
    distances[node] = Infinity;
    previous[node] = null;
  }
  distances[startNodeId] = 0;

  while (queue.size > 0) {
    let minNode = null;
    for (const node of queue) {
      if (minNode === null || distances[node] < distances[minNode]) {
        minNode = node;
      }
    }

    if (distances[minNode] === Infinity) {
      break;
    }

    queue.delete(minNode);

    // If we reached a target node type, we found the nearest one
    if (graph.nodes[minNode].type === targetType && minNode !== startNodeId) {
      let path = [];
      let current = minNode;
      while (current !== null) {
        path.unshift(graph.nodes[current].label);
        current = previous[current];
      }
      return {
        target: graph.nodes[minNode],
        distance: distances[minNode],
        path: path.join(' -> ')
      };
    }

    for (const neighbor of adj[minNode]) {
      const alt = distances[minNode] + neighbor.weight;
      if (alt < distances[neighbor.node]) {
        distances[neighbor.node] = alt;
        previous[neighbor.node] = minNode;
      }
    }
  }

  return { error: `No ${targetType} found reachable from ${startNodeId}` };
}
