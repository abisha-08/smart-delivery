import React, { useState } from 'react';
import { HUB_COORDINATES } from '../utils/networkUtils';
import { MapPin, ArrowRight, Clock, AlertTriangle, CheckCircle2, Box, X } from 'lucide-react';

const normalizeNode = (name) => {
  if (!name) return '';
  if (typeof name !== 'string') return String(name);
  return name
    .toLowerCase()
    .replace(/\s+hub\b/gi, '')
    .split(',')[0]
    .trim();
};

const parsePathArray = (p) => {
  if (!p) return null;
  if (Array.isArray(p)) return p;
  if (typeof p === 'string') {
    try {
      const parsed = JSON.parse(p);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      if (p.includes('→')) return p.split('→').map(s => s.trim());
      if (p.includes('->')) return p.split('->').map(s => s.trim());
      if (p.includes(',')) return p.split(',').map(s => s.trim());
    }
  }
  return null;
};

export default function NetworkMap({
  hubs = [],
  routes = [],
  highlightPath = null,
  recommendedPath = null,
  selectedShipment = null,
  activeShipments = [],
  compact = false,
  onRecalculateRoute = null
}) {
  const [selectedHub, setSelectedHub] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);

  // Determine effective recommendedPath & highlightPath from props or selected/active shipment
  const rawRecommended = recommendedPath ||
    selectedShipment?.recommendedRoute ||
    activeShipments.find(s => s.recommendedRoute && (Array.isArray(s.recommendedRoute) ? s.recommendedRoute.length >= 2 : true))?.recommendedRoute ||
    null;

  const effectiveRecommendedPath = parsePathArray(rawRecommended);

  const rawHighlight = highlightPath ||
    selectedShipment?.route ||
    (selectedShipment ? [selectedShipment.origin, selectedShipment.destination] : null);

  const effectiveHighlightPath = parsePathArray(rawHighlight);

  // Merge hub DB data with SVG coordinates
  const hubList = Object.entries(HUB_COORDINATES).map(([cityName, coords]) => {
    const dbHub = hubs.find(h =>
      normalizeNode(h.city) === normalizeNode(cityName) ||
      normalizeNode(h.name) === normalizeNode(cityName) ||
      h.id?.includes(cityName.slice(0, 3).toUpperCase())
    ) || {};

    return {
      name: `${cityName} Hub`,
      city: cityName,
      ...coords,
      status: dbHub.status || 'OPERATIONAL',
      packageCount: dbHub.package_count || (cityName === 'Dallas' ? 11 : cityName === 'Chicago' ? 8 : 6),
      inboundCount: dbHub.inbound_count || 4,
      outboundCount: dbHub.outbound_count || 3
    };
  });

  // Helper to check if a corridor segment is contained in a path
  const isEdgeInPath = (pathArray, edgeFrom, edgeTo) => {
    if (!pathArray || pathArray.length < 2) return false;
    const f = normalizeNode(edgeFrom);
    const t = normalizeNode(edgeTo);
    for (let i = 0; i < pathArray.length - 1; i++) {
      const p1 = normalizeNode(pathArray[i]);
      const p2 = normalizeNode(pathArray[i + 1]);
      if ((p1 === f && p2 === t) || (p1 === t && p2 === f)) {
        return true;
      }
    }
    return false;
  };

  // Base 6 Corridors in the network
  const BASE_CORRIDORS = [
    { from: 'Chicago', to: 'Detroit', time: 120 },
    { from: 'Chicago', to: 'Denver', time: 180 },
    { from: 'Chicago', to: 'Dallas', time: 240 },
    { from: 'Detroit', to: 'Dallas', time: 100 },
    { from: 'Denver', to: 'Dallas', time: 140 },
    { from: 'Dallas', to: 'Houston', time: 90 }
  ];

  const routeElements = BASE_CORRIDORS.map((r, idx) => {
    const fromKey = Object.keys(HUB_COORDINATES).find(k => normalizeNode(k) === normalizeNode(r.from)) || r.from;
    const toKey = Object.keys(HUB_COORDINATES).find(k => normalizeNode(k) === normalizeNode(r.to)) || r.to;

    const fromCoord = HUB_COORDINATES[fromKey] || { x: 300, y: 300 };
    const toCoord = HUB_COORDINATES[toKey] || { x: 400, y: 400 };

    const dbRoute = (routes || []).find(
      d => (normalizeNode(d.from_hub) === normalizeNode(r.from) && normalizeNode(d.to_hub) === normalizeNode(r.to)) ||
           (normalizeNode(d.from_hub) === normalizeNode(r.to) && normalizeNode(d.to_hub) === normalizeNode(r.from))
    );

    const isDelayed = dbRoute?.status === 'DELAYED' || (normalizeNode(r.from) === 'denver' && normalizeNode(r.to) === 'dallas' && (dbRoute?.delay_minutes || 0) > 0);
    const delayMinutes = dbRoute?.delay_minutes || (isDelayed ? 25 : 0);

    const isHighlighted = isEdgeInPath(effectiveHighlightPath, r.from, r.to);
    const isRecommended = isEdgeInPath(effectiveRecommendedPath, r.from, r.to);

    return {
      id: dbRoute?.id || `RTE-${idx}`,
      from: r.from,
      to: r.to,
      fromX: fromCoord.x,
      fromY: fromCoord.y,
      toX: toCoord.x,
      toY: toCoord.y,
      midX: (fromCoord.x + toCoord.x) / 2,
      midY: (fromCoord.y + toCoord.y) / 2,
      time: dbRoute?.travel_time_minutes || r.time,
      status: isDelayed ? 'DELAYED' : 'NORMAL',
      delayMinutes,
      isHighlighted,
      isRecommended
    };
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: compact ? '280px' : '420px' }}>
      {/* SVG Canvas */}
      <svg
        viewBox="80 80 720 490"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          overflow: 'visible'
        }}
      >
        <defs>
          {/* Gradients and Filters */}
          <linearGradient id="routeGradientNormal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>

          <linearGradient id="routeGradientDelayed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>

          <linearGradient id="routeGradientRecommended" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          <filter id="routeGlowGreen" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10B981" floodOpacity="0.8" />
          </filter>

          <filter id="hubGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#351C15" floodOpacity="0.25" />
          </filter>

          <filter id="badgeShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000000" floodOpacity="0.1" />
          </filter>
        </defs>

        {/* 1. Base Route Lines */}
        {routeElements.map((route) => {
          let strokeColor = '#CBD5E1';
          let strokeWidth = 3;
          let strokeDasharray = 'none';

          if (route.status === 'DELAYED') {
            strokeColor = '#EF4444';
            strokeWidth = 4;
            strokeDasharray = '6 4';
          } else if (route.isHighlighted && !route.isRecommended) {
            strokeColor = '#FFB81C';
            strokeWidth = 5;
          }

          return (
            <g
              key={`base-${route.id}`}
              onClick={() => {
                setSelectedRoute(route);
                setSelectedHub(null);
              }}
              style={{ cursor: 'pointer' }}
            >
              {/* Invisible thick line for easy hovering */}
              <line
                x1={route.fromX}
                y1={route.fromY}
                x2={route.toX}
                y2={route.toY}
                stroke="transparent"
                strokeWidth={24}
              />

              {/* Rendered Base Route Line */}
              <line
                x1={route.fromX}
                y1={route.fromY}
                x2={route.toX}
                y2={route.toY}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeLinecap="round"
              />
            </g>
          );
        })}

        {/* 2. Prominent Overlay for Recommended Dijkstra Fastest Route (Always renders ON TOP) */}
        {routeElements.filter(r => r.isRecommended).map((route) => (
          <g
            key={`rec-${route.id}`}
            onClick={() => {
              setSelectedRoute(route);
              setSelectedHub(null);
            }}
            style={{ cursor: 'pointer' }}
          >
            {/* Glowing Green Underline */}
            <line
              x1={route.fromX}
              y1={route.fromY}
              x2={route.toX}
              y2={route.toY}
              stroke="#10B981"
              strokeWidth={8}
              strokeLinecap="round"
              filter="url(#routeGlowGreen)"
            />
            {/* Core Solid Green Line */}
            <line
              x1={route.fromX}
              y1={route.fromY}
              x2={route.toX}
              y2={route.toY}
              stroke="#10B981"
              strokeWidth={6}
              strokeLinecap="round"
            />
          </g>
        ))}

        {/* 3. Animated Package Dots & Travel Time Badges */}
        {routeElements.map((route) => {
          return (
            <g key={`badge-${route.id}`}>
              {/* Animated Package Dot */}
              <circle
                r={route.isRecommended ? 6 : route.status === 'DELAYED' ? 4 : 5}
                fill={route.isRecommended ? '#10B981' : route.status === 'DELAYED' ? '#DC2626' : '#FFB81C'}
                stroke={route.isRecommended ? '#FFFFFF' : 'none'}
                strokeWidth={route.isRecommended ? 1.5 : 0}
              >
                <animateMotion
                  path={`M ${route.fromX} ${route.fromY} L ${route.toX} ${route.toY}`}
                  dur={route.isRecommended ? '3.5s' : route.status === 'DELAYED' ? '7s' : '4.5s'}
                  repeatCount="indefinite"
                />
              </circle>

              {/* Route Travel Time Badge */}
              <g
                transform={`translate(${route.midX}, ${route.midY})`}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setSelectedRoute(route);
                  setSelectedHub(null);
                }}
              >
                <rect
                  x="-34"
                  y="-13"
                  width="68"
                  height="26"
                  rx="13"
                  fill={route.isRecommended ? '#DCFCE7' : route.status === 'DELAYED' ? '#FEE2E2' : '#FFFFFF'}
                  stroke={route.isRecommended ? '#10B981' : route.status === 'DELAYED' ? '#EF4444' : '#E2E8F0'}
                  strokeWidth={route.isRecommended ? 2 : 1.5}
                  filter="url(#badgeShadow)"
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill={route.isRecommended ? '#065F46' : route.status === 'DELAYED' ? '#991B1B' : '#475569'}
                  fontSize="11"
                  fontWeight="800"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {route.time}m{(!route.isRecommended && route.delayMinutes > 0) ? ` +${route.delayMinutes}` : ''}
                </text>
              </g>
            </g>
          );
        })}

        {/* 4. Hub Nodes */}
        {hubList.map((hub) => {
          const isSelected = selectedHub?.city === hub.city;
          const isHubInRecommended = effectiveRecommendedPath?.some(p => normalizeNode(p) === normalizeNode(hub.city));
          const isHubInHighlight = effectiveHighlightPath?.some(p => normalizeNode(p) === normalizeNode(hub.city)) || isHubInRecommended;

          return (
            <g
              key={hub.city}
              transform={`translate(${hub.x}, ${hub.y})`}
              onClick={() => {
                setSelectedHub(hub);
                setSelectedRoute(null);
              }}
              style={{ cursor: 'pointer' }}
            >
              {/* Outer pulsing ring for hubs with active packages */}
              <circle
                r={isSelected ? 30 : (isHubInRecommended ? 28 : 25)}
                fill="none"
                stroke={isHubInRecommended ? '#10B981' : isHubInHighlight ? '#FFB81C' : '#351C15'}
                strokeWidth={isSelected ? 3 : (isHubInRecommended ? 3 : 1.5)}
                opacity={isHubInRecommended ? 0.8 : 0.3}
              />

              {/* Main Hub Circle */}
              <circle
                r={isSelected ? 22 : 18}
                fill={isHubInRecommended ? '#10B981' : isHubInHighlight ? '#FFB81C' : '#351C15'}
                filter="url(#hubGlow)"
              />

              {/* Inner dot */}
              <circle
                r={6}
                fill={isHubInRecommended || isHubInHighlight ? '#FFFFFF' : '#FFB81C'}
              />

              {/* Hub Label Badge */}
              <g transform="translate(0, 34)">
                <rect
                  x="-55"
                  y="-10"
                  width="110"
                  height="22"
                  rx="6"
                  fill={isHubInRecommended ? '#DCFCE7' : '#FFFFFF'}
                  stroke={isHubInRecommended ? '#10B981' : '#E2E8F0'}
                  strokeWidth={isHubInRecommended ? 1.5 : 1}
                  filter="url(#badgeShadow)"
                />
                <text
                  x="0"
                  y="5"
                  textAnchor="middle"
                  fill={isHubInRecommended ? '#065F46' : '#1E293B'}
                  fontSize="11"
                  fontWeight="800"
                  letterSpacing="0.02em"
                >
                  {hub.city.toUpperCase()} ({hub.packageCount})
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* Network Legend */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(4px)',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '8px 14px',
        fontSize: '11px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '3px', backgroundColor: '#94A3B8', borderRadius: '2px' }} />
          <span style={{ color: '#475569', fontWeight: '600' }}>Normal Route</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '3px', backgroundColor: '#EF4444', borderRadius: '2px' }} />
          <span style={{ color: '#DC2626', fontWeight: '700' }}>Delayed Route</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '3px', backgroundColor: '#10B981', borderRadius: '2px' }} />
          <span style={{ color: '#059669', fontWeight: '700' }}>Fastest (Dijkstra)</span>
        </div>
      </div>

      {/* Interactive Detail Popup: Hub */}
      {selectedHub && (
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          width: '260px',
          backgroundColor: '#FFFFFF',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
          padding: '16px',
          zIndex: 10,
          animation: 'popIn 0.15s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#351C15' }}>{selectedHub.name}</div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>State: {selectedHub.state} • Hub Node</div>
            </div>
            <button onClick={() => setSelectedHub(null)} style={{ color: '#94A3B8', padding: '2px' }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ color: '#64748B' }}>Operational Status:</span>
              <span style={{ color: '#16A34A', fontWeight: '700' }}>OPERATIONAL</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ color: '#64748B' }}>Current Packages:</span>
              <span style={{ fontWeight: '700', fontFamily: 'var(--font-mono)' }}>{selectedHub.packageCount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ color: '#64748B' }}>Inbound Capacity:</span>
              <span style={{ fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{selectedHub.inboundCount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: '#64748B' }}>Outbound Dispatch:</span>
              <span style={{ fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{selectedHub.outboundCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Detail Popup: Route */}
      {selectedRoute && (
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          width: '270px',
          backgroundColor: '#FFFFFF',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
          padding: '16px',
          zIndex: 10,
          animation: 'popIn 0.15s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#351C15', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{selectedRoute.from}</span>
                <ArrowRight size={13} color="#FFB81C" />
                <span>{selectedRoute.to}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>Corridor Transit Line</div>
            </div>
            <button onClick={() => setSelectedRoute(null)} style={{ color: '#94A3B8', padding: '2px' }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ color: '#64748B' }}>Travel Time:</span>
              <span style={{ fontWeight: '700', fontFamily: 'var(--font-mono)' }}>{selectedRoute.time} min</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ color: '#64748B' }}>Route Health:</span>
              <span style={{
                color: selectedRoute.status === 'DELAYED' ? '#DC2626' : '#16A34A',
                fontWeight: '700'
              }}>
                {selectedRoute.status}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: '#64748B' }}>Active Delay:</span>
              <span style={{
                color: selectedRoute.delayMinutes > 0 ? '#DC2626' : '#16A34A',
                fontWeight: '700',
                fontFamily: 'var(--font-mono)'
              }}>
                {selectedRoute.delayMinutes > 0 ? `+${selectedRoute.delayMinutes} min` : '0 min'}
              </span>
            </div>

            {onRecalculateRoute && (selectedRoute.status === 'DELAYED' || normalizeNode(selectedRoute.from) === 'denver' || normalizeNode(selectedRoute.to) === 'denver') && (
              <button
                className="btn btn-sm btn-brown"
                onClick={() => {
                  onRecalculateRoute('SHP-1002');
                  setSelectedRoute(null);
                }}
                style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }}
              >
                <Zap size={14} color="#FFB81C" />
                <span>RECALCULATE FASTEST ROUTE</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
