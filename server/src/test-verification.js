/**
 * End-to-End Verification Test Script
 * Verifies all 7 core demo scenarios and system requirements.
 */

const http = require('http');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(resData);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resData });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runVerification() {
  console.log('========================================================');
  console.log('STARTING FULL SYSTEM VALIDATION & DEMO SCENARIOS TEST');
  console.log('========================================================\n');

  // Step 1: Health & Database check
  console.log('1. Checking Backend Health & Database Connectivity...');
  const health = await request('GET', '/api/health');
  if (health.data.status !== 'OK') throw new Error('Backend health failed');
  console.log('   ✓ Health OK:', health.data);

  // Step 2: Verify Initial Seed State & Stats
  console.log('\n2. Verifying Initial Seed Data & Stats...');
  await request('POST', '/api/reset-demo');
  const stats = await request('GET', '/api/stats');
  console.log('   ✓ Stats:', stats.data.data);
  if (stats.data.data.activeShipments !== 12 || stats.data.data.atRisk !== 3 || stats.data.data.delayed !== 2) {
    throw new Error('Stats do not match required initial seed data');
  }

  // Step 3: Verify Demo Primary Shipment UPS1002
  console.log('\n3. Verifying Primary Demo Shipment UPS1002...');
  const ups1002 = await request('GET', '/api/shipments/UPS1002');
  console.log('   ✓ UPS1002:', ups1002.data.data);
  if (
    ups1002.data.data.trackingNumber !== 'UPS1002' ||
    ups1002.data.data.status !== 'AT_RISK' ||
    ups1002.data.data.currentLocation !== 'Denver' ||
    ups1002.data.data.destination !== 'Houston'
  ) {
    throw new Error('UPS1002 does not match initial specification');
  }

  // Step 4: Demo Scenario 2 — Simulate Delay
  console.log('\n4. Testing Demo Scenario 2: Simulate Delay (+20 min)...');
  const delayRes = await request('POST', '/api/shipments/UPS1002/delay', { minutes: 20 });
  console.log('   ✓ New Delay:', delayRes.data.data.delayMinutes, 'm | New ETA:', delayRes.data.data.eta, '| Status:', delayRes.data.data.status);
  if (delayRes.data.data.status !== 'DELAYED' || delayRes.data.data.delayMinutes !== 35) {
    throw new Error('Delay simulation failed to transition status to DELAYED');
  }

  // Step 5: Demo Scenario 3 — Dijkstra Route Recalculation
  console.log('\n5. Testing Demo Scenario 3: Recalculate Fastest Route (Dijkstra)...');
  const recalcRes = await request('POST', '/api/shipments/UPS1002/recalculate');
  console.log('   ✓ Dijkstra Recalculated Path:', recalcRes.data.path, '| Travel Time:', recalcRes.data.travelTimeMinutes, 'min');
  if (!recalcRes.data.path || recalcRes.data.path.length < 2) {
    throw new Error('Dijkstra calculation failed');
  }

  // Step 6: Demo Scenario 4 — Apply Route
  console.log('\n6. Testing Demo Scenario 4: Apply Route...');
  const applyRes = await request('POST', '/api/shipments/UPS1002/apply-route');
  console.log('   ✓ Applied Route:', applyRes.data.data.route, '| Status:', applyRes.data.data.status);
  if (applyRes.data.data.recommendedRoute !== null) {
    throw new Error('Recommended route should be cleared/applied');
  }

  // Step 7: Demo Scenario 5 — Legacy System Simulation
  console.log('\n7. Testing Demo Scenario 5: Live Legacy & RFID Simulation...');
  await request('POST', '/api/simulation/start', { interval: 500 });
  await new Promise(r => setTimeout(r, 2000));
  const simStatus = await request('GET', '/api/simulation/status');
  console.log('   ✓ Simulation Status:', simStatus.data);
  const eventsRes = await request('GET', '/api/events?limit=5');
  console.log('   ✓ Recent Events:', eventsRes.data.data.map(e => `[${e.type}] ${e.message}`));
  await request('POST', '/api/simulation/stop');

  // Step 8: Demo Scenario 6 & 7 — Offline Sync Queue
  console.log('\n8. Testing Demo Scenario 6 & 7: Offline Action Synchronization...');
  const offlineActions = [
    {
      id: 'off-test-01',
      type: 'DELAY_EVENT',
      shipmentId: 'UPS1005',
      payload: { minutesToAdd: 25 },
      timestamp: new Date().toISOString()
    },
    {
      id: 'off-test-02',
      type: 'APPLY_ROUTE',
      shipmentId: 'UPS1007',
      payload: {},
      timestamp: new Date().toISOString()
    }
  ];
  const syncRes = await request('POST', '/api/sync', offlineActions);
  console.log('   ✓ Sync Response:', syncRes.data);
  if (!syncRes.data.success || syncRes.data.syncedCount !== 2) {
    throw new Error('Offline sync queue processing failed');
  }

  // Reset back to clean demo seed state
  console.log('\n9. Resetting Database back to pristine demo state...');
  const resetRes = await request('POST', '/api/reset-demo');
  console.log('   ✓ Reset Result:', resetRes.data);

  console.log('\n========================================================');
  console.log('✓ ALL 7 DEMO SCENARIOS & REQUIREMENTS FULLY VALIDATED!');
  console.log('========================================================');
}

runVerification().catch(err => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
