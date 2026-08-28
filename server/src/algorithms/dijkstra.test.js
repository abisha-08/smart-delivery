const { findShortestPath } = require('./dijkstra');

// Logistics Network Graph
// Chicago -> Detroit = 120
// Chicago -> Denver = 180
// Chicago -> Dallas = 240
// Detroit -> Dallas = 100
// Denver -> Dallas = 140
// Dallas -> Houston = 90

const logisticsGraph = {
  Chicago: [
    { node: 'Detroit', weight: 120 },
    { node: 'Denver', weight: 180 },
    { node: 'Dallas', weight: 240 }
  ],
  Detroit: [
    { node: 'Chicago', weight: 120 },
    { node: 'Dallas', weight: 100 }
  ],
  Denver: [
    { node: 'Chicago', weight: 180 },
    { node: 'Dallas', weight: 140 }
  ],
  Dallas: [
    { node: 'Chicago', weight: 240 },
    { node: 'Detroit', weight: 100 },
    { node: 'Denver', weight: 140 },
    { node: 'Houston', weight: 90 }
  ],
  Houston: [
    { node: 'Dallas', weight: 90 }
  ]
};

console.log('Testing Dijkstra Algorithm on UPS Logistics Network...');

// Test 1: Denver to Houston
const result1 = findShortestPath(logisticsGraph, 'Denver', 'Houston');
console.log('Test 1 (Denver -> Houston):', result1);
if (
  JSON.stringify(result1.path) === JSON.stringify(['Denver', 'Dallas', 'Houston']) &&
  result1.distance === 230
) {
  console.log('✓ Test 1 Passed!');
} else {
  console.error('✗ Test 1 Failed!', result1);
  process.exit(1);
}

// Test 2: Chicago to Houston (Chicago -> Detroit (120) -> Dallas (100) -> Houston (90) = 310 min vs Chicago -> Dallas (240) -> Houston (90) = 330 min)
const result2 = findShortestPath(logisticsGraph, 'Chicago', 'Houston');
console.log('Test 2 (Chicago -> Houston):', result2);
if (
  JSON.stringify(result2.path) === JSON.stringify(['Chicago', 'Detroit', 'Dallas', 'Houston']) &&
  result2.distance === 310
) {
  console.log('✓ Test 2 Passed (Chose faster Detroit bypass)!');
} else {
  console.error('✗ Test 2 Failed!', result2);
  process.exit(1);
}

// Test 3: Same node
const result3 = findShortestPath(logisticsGraph, 'Denver', 'Denver');
console.log('Test 3 (Denver -> Denver):', result3);
if (result3.distance === 0 && result3.path[0] === 'Denver') {
  console.log('✓ Test 3 Passed!');
} else {
  console.error('✗ Test 3 Failed!', result3);
  process.exit(1);
}

console.log('All Dijkstra tests passed successfully!');
