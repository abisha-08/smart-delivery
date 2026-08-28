const { evaluateShipmentStatus } = require('../services/riskService');

function getSeedData() {
  const hubs = [
    {
      id: 'HUB-CHI',
      name: 'Chicago Hub',
      city: 'Chicago, IL',
      status: 'OPERATIONAL',
      package_count: 8,
      inbound_count: 4,
      outbound_count: 4,
      x_pos: 520,
      y_pos: 150
    },
    {
      id: 'HUB-DET',
      name: 'Detroit Hub',
      city: 'Detroit, MI',
      status: 'OPERATIONAL',
      package_count: 5,
      inbound_count: 3,
      outbound_count: 2,
      x_pos: 680,
      y_pos: 140
    },
    {
      id: 'HUB-DEN',
      name: 'Denver Hub',
      city: 'Denver, CO',
      status: 'OPERATIONAL',
      package_count: 7,
      inbound_count: 2,
      outbound_count: 5,
      x_pos: 200,
      y_pos: 240
    },
    {
      id: 'HUB-DFW',
      name: 'Dallas Hub',
      city: 'Dallas, TX',
      status: 'OPERATIONAL',
      package_count: 11,
      inbound_count: 6,
      outbound_count: 5,
      x_pos: 450,
      y_pos: 420
    },
    {
      id: 'HUB-HOU',
      name: 'Houston Hub',
      city: 'Houston, TX',
      status: 'OPERATIONAL',
      package_count: 9,
      inbound_count: 7,
      outbound_count: 2,
      x_pos: 490,
      y_pos: 530
    }
  ];

  const routes = [
    {
      id: 'RTE-CHI-DET',
      from_hub: 'Chicago',
      to_hub: 'Detroit',
      travel_time_minutes: 120,
      status: 'NORMAL',
      delay_minutes: 0
    },
    {
      id: 'RTE-CHI-DEN',
      from_hub: 'Chicago',
      to_hub: 'Denver',
      travel_time_minutes: 180,
      status: 'NORMAL',
      delay_minutes: 0
    },
    {
      id: 'RTE-CHI-DFW',
      from_hub: 'Chicago',
      to_hub: 'Dallas',
      travel_time_minutes: 240,
      status: 'NORMAL',
      delay_minutes: 0
    },
    {
      id: 'RTE-DET-DFW',
      from_hub: 'Detroit',
      to_hub: 'Dallas',
      travel_time_minutes: 100,
      status: 'NORMAL',
      delay_minutes: 0
    },
    {
      id: 'RTE-DEN-DFW',
      from_hub: 'Denver',
      to_hub: 'Dallas',
      travel_time_minutes: 140,
      status: 'DELAYED',
      delay_minutes: 25
    },
    {
      id: 'RTE-DFW-HOU',
      from_hub: 'Dallas',
      to_hub: 'Houston',
      travel_time_minutes: 90,
      status: 'NORMAL',
      delay_minutes: 0
    }
  ];

  const shipments = [
    {
      id: 'SHP-1001',
      tracking_number: 'UPS1001',
      origin: 'Chicago',
      current_location: 'Chicago',
      destination: 'Detroit',
      eta: '11:30',
      deadline: '12:00',
      delay_minutes: 0,
      status: 'ON_TRACK',
      route_json: JSON.stringify(['Chicago', 'Detroit']),
      recommended_route_json: null
    },
    {
      id: 'SHP-1002',
      tracking_number: 'UPS1002',
      origin: 'Denver',
      current_location: 'Denver',
      destination: 'Houston',
      eta: '16:45',
      deadline: '16:30',
      delay_minutes: 15,
      status: 'AT_RISK',
      route_json: JSON.stringify(['Denver', 'Dallas', 'Houston']),
      recommended_route_json: null
    },
    {
      id: 'SHP-1003',
      tracking_number: 'UPS1003',
      origin: 'Detroit',
      current_location: 'Detroit',
      destination: 'Houston',
      eta: '18:15',
      deadline: '17:30',
      delay_minutes: 45,
      status: 'DELAYED',
      route_json: JSON.stringify(['Detroit', 'Dallas', 'Houston']),
      recommended_route_json: null
    },
    {
      id: 'SHP-1004',
      tracking_number: 'UPS1004',
      origin: 'Chicago',
      current_location: 'Chicago',
      destination: 'Denver',
      eta: '13:00',
      deadline: '13:30',
      delay_minutes: 0,
      status: 'ON_TRACK',
      route_json: JSON.stringify(['Chicago', 'Denver']),
      recommended_route_json: null
    },
    {
      id: 'SHP-1005',
      tracking_number: 'UPS1005',
      origin: 'Chicago',
      current_location: 'Chicago',
      destination: 'Dallas',
      eta: '15:10',
      deadline: '15:00',
      delay_minutes: 10,
      status: 'AT_RISK',
      route_json: JSON.stringify(['Chicago', 'Dallas']),
      recommended_route_json: null
    },
    {
      id: 'SHP-1006',
      tracking_number: 'UPS1006',
      origin: 'Denver',
      current_location: 'Dallas',
      destination: 'Houston',
      eta: '19:35',
      deadline: '19:00',
      delay_minutes: 35,
      status: 'DELAYED',
      route_json: JSON.stringify(['Denver', 'Dallas', 'Houston']),
      recommended_route_json: null
    },
    {
      id: 'SHP-1007',
      tracking_number: 'UPS1007',
      origin: 'Detroit',
      current_location: 'Detroit',
      destination: 'Dallas',
      eta: '14:15',
      deadline: '14:00',
      delay_minutes: 15,
      status: 'AT_RISK',
      route_json: JSON.stringify(['Detroit', 'Dallas']),
      recommended_route_json: null
    },
    {
      id: 'SHP-1008',
      tracking_number: 'UPS1008',
      origin: 'Dallas',
      current_location: 'Dallas',
      destination: 'Houston',
      eta: '10:45',
      deadline: '11:30',
      delay_minutes: 0,
      status: 'ON_TRACK',
      route_json: JSON.stringify(['Dallas', 'Houston']),
      recommended_route_json: null
    },
    {
      id: 'SHP-1009',
      tracking_number: 'UPS1009',
      origin: 'Chicago',
      current_location: 'Detroit',
      destination: 'Detroit',
      eta: '14:00',
      deadline: '14:30',
      delay_minutes: 0,
      status: 'ON_TRACK',
      route_json: JSON.stringify(['Chicago', 'Detroit']),
      recommended_route_json: null
    },
    {
      id: 'SHP-1010',
      tracking_number: 'UPS1010',
      origin: 'Denver',
      current_location: 'Denver',
      destination: 'Houston',
      eta: '17:00',
      deadline: '17:30',
      delay_minutes: 0,
      status: 'ON_TRACK',
      route_json: JSON.stringify(['Denver', 'Dallas', 'Houston']),
      recommended_route_json: null
    },
    {
      id: 'SHP-1011',
      tracking_number: 'UPS1011',
      origin: 'Chicago',
      current_location: 'Denver',
      destination: 'Dallas',
      eta: '18:30',
      deadline: '19:00',
      delay_minutes: 0,
      status: 'ON_TRACK',
      route_json: JSON.stringify(['Chicago', 'Denver', 'Dallas']),
      recommended_route_json: null
    },
    {
      id: 'SHP-1012',
      tracking_number: 'UPS1012',
      origin: 'Detroit',
      current_location: 'Dallas',
      destination: 'Houston',
      eta: '20:00',
      deadline: '20:30',
      delay_minutes: 0,
      status: 'ON_TRACK',
      route_json: JSON.stringify(['Detroit', 'Dallas', 'Houston']),
      recommended_route_json: null
    }
  ];

  const now = new Date();
  const formatIso = (offsetMinutes = 0) => new Date(now.getTime() - offsetMinutes * 60000).toISOString();

  const events = [
    {
      id: 'EVT-001',
      timestamp: formatIso(45),
      type: 'PACKAGE_ARRIVAL',
      shipment_id: 'UPS1006',
      message: 'UPS1006 arrived at Dallas Hub from Denver.',
      source: 'RFID_SCANNER'
    },
    {
      id: 'EVT-002',
      timestamp: formatIso(35),
      type: 'DELAY_EVENT',
      shipment_id: 'UPS1003',
      message: 'UPS1003 experiencing +45 minute highway transit delay near Detroit.',
      source: 'LEGACY_QUEUE'
    },
    {
      id: 'EVT-003',
      timestamp: formatIso(25),
      type: 'RFID_SCAN',
      shipment_id: 'UPS1002',
      message: 'UPS1002 detected at Denver Hub sorting bay 4.',
      source: 'RFID_SCANNER'
    },
    {
      id: 'EVT-004',
      timestamp: formatIso(15),
      type: 'HUB_UPDATE',
      shipment_id: 'UPS1005',
      message: 'UPS1005 queued for outbound dispatch at Chicago Hub.',
      source: 'SYSTEM'
    },
    {
      id: 'EVT-005',
      timestamp: formatIso(5),
      type: 'DELAY_EVENT',
      shipment_id: 'UPS1002',
      message: 'UPS1002 flagged AT RISK: Estimated delivery 16:45 exceeds 16:30 deadline.',
      source: 'SYSTEM'
    }
  ];

  return { hubs, routes, shipments, events };
}

function seedDatabase(db) {
  const { hubs, routes, shipments, events } = getSeedData();
  const nowStr = new Date().toISOString();

  const insertHub = db.prepare(`
    INSERT INTO hubs (id, name, city, status, package_count, inbound_count, outbound_count, x_pos, y_pos)
    VALUES (@id, @name, @city, @status, @package_count, @inbound_count, @outbound_count, @x_pos, @y_pos)
  `);

  const insertRoute = db.prepare(`
    INSERT INTO routes (id, from_hub, to_hub, travel_time_minutes, status, delay_minutes)
    VALUES (@id, @from_hub, @to_hub, @travel_time_minutes, @status, @delay_minutes)
  `);

  const insertShipment = db.prepare(`
    INSERT INTO shipments (id, tracking_number, origin, current_location, destination, eta, deadline, delay_minutes, status, route_json, recommended_route_json, created_at, updated_at)
    VALUES (@id, @tracking_number, @origin, @current_location, @destination, @eta, @deadline, @delay_minutes, @status, @route_json, @recommended_route_json, @created_at, @updated_at)
  `);

  const insertEvent = db.prepare(`
    INSERT INTO events (id, timestamp, type, shipment_id, message, source)
    VALUES (@id, @timestamp, @type, @shipment_id, @message, @source)
  `);

  const transaction = db.transaction(() => {
    // Clear existing
    db.prepare('DELETE FROM hubs').run();
    db.prepare('DELETE FROM routes').run();
    db.prepare('DELETE FROM shipments').run();
    db.prepare('DELETE FROM events').run();
    db.prepare('DELETE FROM sync_queue').run();

    for (const hub of hubs) {
      insertHub.run(hub);
    }

    for (const route of routes) {
      insertRoute.run(route);
    }

    for (const shipment of shipments) {
      // Re-verify status with risk engine for strict data integrity
      const computedStatus = evaluateShipmentStatus(shipment.eta, shipment.deadline, shipment.delay_minutes);
      insertShipment.run({
        ...shipment,
        status: computedStatus,
        created_at: nowStr,
        updated_at: nowStr
      });
    }

    for (const event of events) {
      insertEvent.run(event);
    }
  });

  transaction();
  console.log(`✓ Seeded ${hubs.length} hubs, ${routes.length} routes, ${shipments.length} shipments, ${events.length} events into SQLite.`);
}

module.exports = {
  getSeedData,
  seedDatabase
};
