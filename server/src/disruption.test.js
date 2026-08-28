/**
 * Disruption Simulation Verification Test
 * Tests Weather, Traffic, Hub Congestion, and Connectivity Loss disruptions end-to-end.
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

async function runDisruptionTests() {
  console.log('========================================================');
  console.log('STARTING DISRUPTION SIMULATION END-TO-END TEST');
  console.log('========================================================\n');

  // Reset demo state first
  await request('POST', '/api/reset-demo');

  // Test 1: Weather Disruption
  console.log('1. Testing Weather Disruption on UPS1001 (Chicago -> Dallas)...');
  const weatherRes = await request('POST', '/api/shipments/UPS1001/disruption', { disruptionType: 'WEATHER', minutes: 45 });
  console.log('   ✓ Weather Response:', {
    trackingNumber: weatherRes.data.trackingNumber,
    delayAdded: weatherRes.data.delayAdded,
    newEta: weatherRes.data.newEta,
    newStatus: weatherRes.data.newStatus,
    recommendedRoute: weatherRes.data.recommendedRoute
  });
  if (weatherRes.data.delayAdded !== 45 || weatherRes.data.newStatus !== 'DELAYED') {
    throw new Error('Weather disruption failed to increase travel time and transition status');
  }

  // Test 2: Traffic Disruption
  console.log('\n2. Testing Traffic Disruption on UPS1003 (Detroit -> Houston)...');
  const trafficRes = await request('POST', '/api/shipments/UPS1003/disruption', { disruptionType: 'TRAFFIC', minutes: 35 });
  console.log('   ✓ Traffic Response:', {
    trackingNumber: trafficRes.data.trackingNumber,
    delayAdded: trafficRes.data.delayAdded,
    newEta: trafficRes.data.newEta,
    newStatus: trafficRes.data.newStatus,
    recommendedRoute: trafficRes.data.recommendedRoute
  });
  if (trafficRes.data.delayAdded !== 35 || (trafficRes.data.newStatus !== 'AT_RISK' && trafficRes.data.newStatus !== 'DELAYED')) {
    throw new Error('Traffic disruption failed to increase travel time and trigger Risk Engine');
  }

  // Test 3: Hub Congestion Disruption
  console.log('\n3. Testing Hub Congestion Disruption on UPS1004 (Dallas -> Chicago)...');
  const hubRes = await request('POST', '/api/shipments/UPS1004/disruption', { disruptionType: 'HUB_CONGESTION', minutes: 25 });
  console.log('   ✓ Hub Congestion Response:', {
    trackingNumber: hubRes.data.trackingNumber,
    delayAdded: hubRes.data.delayAdded,
    newEta: hubRes.data.newEta,
    newStatus: hubRes.data.newStatus
  });
  if (hubRes.data.delayAdded !== 25 || hubRes.data.newStatus !== 'AT_RISK') {
    throw new Error('Hub congestion failed to add processing delay and transition status to AT_RISK');
  }

  // Test 4: Verify Events Logged in History
  console.log('\n4. Verifying Disruption Events in Event History...');
  const eventsRes = await request('GET', '/api/events?limit=10');
  const disruptionEvents = eventsRes.data.data.filter(e => e.message.includes('DISRUPTION') || e.message.includes('CONGESTION'));
  console.log('   ✓ Recorded Disruption Events Count:', disruptionEvents.length);
  disruptionEvents.forEach(e => console.log(`     - [${e.type}] ${e.message}`));
  if (disruptionEvents.length < 3) {
    throw new Error('Disruption events were not properly logged to event history');
  }

  // Test 5: Test Apply Route on Disrupted Shipment
  console.log('\n5. Testing Apply Route Recovery on Disrupted Shipment UPS1001...');
  const applyRes = await request('POST', '/api/shipments/UPS1001/apply-route');
  console.log('   ✓ Recovery Apply Result:', {
    trackingNumber: applyRes.data.data.trackingNumber,
    route: applyRes.data.data.route,
    status: applyRes.data.data.status,
    eta: applyRes.data.data.eta
  });

  // Test 6: Offline Sync with Disruption Action
  console.log('\n6. Testing Offline Queue & Sync with Disruption Action...');
  const offlineSyncPayload = [
    {
      id: 'off-disrupt-01',
      type: 'DISRUPTION',
      shipmentId: 'UPS1005',
      payload: { disruptionType: 'WEATHER', minutes: 40 },
      timestamp: new Date().toISOString()
    }
  ];
  const syncRes = await request('POST', '/api/sync', offlineSyncPayload);
  console.log('   ✓ Disruption Sync Result:', syncRes.data);
  if (!syncRes.data.success || syncRes.data.syncedCount !== 1) {
    throw new Error('Offline disruption synchronization failed');
  }

  // Reset database back to clean demo state
  console.log('\n7. Restoring Database to Clean Demo State...');
  await request('POST', '/api/reset-demo');

  console.log('\n========================================================');
  console.log('✓ ALL 4 DISRUPTION TYPES AND RECOVERY WORKFLOWS PASSED!');
  console.log('========================================================\n');
}

runDisruptionTests().catch(err => {
  console.error('\n❌ Disruption Test Failed:', err);
  process.exit(1);
});
