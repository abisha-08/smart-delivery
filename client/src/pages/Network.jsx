import React, { useState } from 'react';
import NetworkMap from '../components/NetworkMap';
import StatusBadge from '../components/StatusBadge';
import { HUB_COORDINATES } from '../utils/networkUtils';
import { MapPin, Navigation, Clock, Activity, ArrowRight, Zap } from 'lucide-react';

export default function Network({
  network = { hubs: [], routes: [] },
  shipments = [],
  selectedShipment = null,
  recommendedRoute = null,
  onRecalculateRoute = null,
  onSelectShipment = null
}) {
  const [selectedRouteFilter, setSelectedRouteFilter] = useState(null);

  const hubs = network.hubs || [];
  const routes = network.routes || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 5 Hub Telemetry Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '14px'
      }}>
        {['Chicago', 'Detroit', 'Denver', 'Dallas', 'Houston'].map((city) => {
          const dbHub = hubs.find(h => h.city?.includes(city) || h.name?.includes(city)) || {};
          const pkgCount = dbHub.package_count || (city === 'Dallas' ? 11 : city === 'Chicago' ? 8 : city === 'Denver' ? 7 : 5);
          const inCount = dbHub.inbound_count || 4;
          const outCount = dbHub.outbound_count || 3;

          return (
            <div
              key={city}
              className="card"
              style={{
                padding: '16px',
                borderTop: '3px solid #351C15',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#351C15' }}>
                  {city} Hub
                </span>
                <span style={{
                  fontSize: '9px',
                  fontWeight: '700',
                  backgroundColor: '#DCFCE7',
                  color: '#15803D',
                  padding: '2px 5px',
                  borderRadius: '3px'
                }}>
                  ACTIVE
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#111827' }}>
                  {pkgCount}
                </span>
                <span style={{ fontSize: '11px', color: '#6B7280' }}>packages</span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#64748B',
                borderTop: '1px solid #F1F5F9',
                paddingTop: '6px'
              }}>
                <span>Inbound: <strong>{inCount}</strong></span>
                <span>Outbound: <strong>{outCount}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid: Left Interactive SVG Map, Right Corridor Health List */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '20px',
        minHeight: '480px'
      }}>
        {/* SVG Network Map */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E5E7EB',
            backgroundColor: '#FBFBFA',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#351C15' }}>
                Inter-Hub Network Topology
              </h2>
              <div style={{ fontSize: '11px', color: '#6B7280' }}>
                Click hubs or corridors to inspect live throughput and delays
              </div>
            </div>

            {onRecalculateRoute && (
              <button
                onClick={() => onRecalculateRoute('SHP-1002')}
                className="btn btn-sm btn-brown"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Calculate fastest route using Dijkstra algorithm"
              >
                <Navigation size={13} />
                <span>RECALCULATE FASTEST ROUTE</span>
              </button>
            )}
          </div>

          <div style={{ flex: 1, padding: '16px' }}>
            <NetworkMap
              hubs={hubs}
              routes={routes}
              activeShipments={shipments}
              selectedShipment={selectedShipment}
              recommendedPath={recommendedRoute || selectedShipment?.recommendedRoute}
              onRecalculateRoute={onRecalculateRoute}
            />
          </div>
        </div>

        {/* Corridor Health Status Table */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E5E7EB',
            backgroundColor: '#FBFBFA'
          }}>
            <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#351C15' }}>
              Corridor Travel Times & Status
            </h2>
            <div style={{ fontSize: '11px', color: '#6B7280' }}>
              Base Dijkstra Weights and Active Corridor Congestion
            </div>
          </div>

          <div style={{ overflowX: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 16px' }}>Corridor</th>
                  <th style={{ padding: '10px 16px' }}>Base Time</th>
                  <th style={{ padding: '10px 16px' }}>Delay</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((r, idx) => {
                  const isDelayed = r.status === 'DELAYED' || (r.from_hub === 'Denver' && r.to_hub === 'Dallas' && (r.delay_minutes || 0) > 0);

                  return (
                    <tr
                      key={r.id || idx}
                      style={{
                        borderBottom: '1px solid #F3F4F6',
                        backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FCFCFB'
                      }}
                    >
                      <td style={{ padding: '10px 16px', fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{r.from_hub}</span>
                        <ArrowRight size={12} color="#FFB81C" />
                        <span>{r.to_hub}</span>
                      </td>
                      <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)' }}>
                        {r.travel_time_minutes} min
                      </td>
                      <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)' }}>
                        {(r.delay_minutes || 0) > 0 ? (
                          <span style={{ color: '#DC2626', fontWeight: '700' }}>
                            +{r.delay_minutes} min
                          </span>
                        ) : (
                          <span style={{ color: '#15803D' }}>0 min</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: isDelayed ? '#FEE2E2' : '#DCFCE7',
                            color: isDelayed ? '#DC2626' : '#15803D'
                          }}>
                            {isDelayed ? 'DELAYED' : 'NORMAL'}
                          </span>
                          {isDelayed && onRecalculateRoute && (
                            <button
                              onClick={() => onRecalculateRoute('SHP-1002')}
                              className="btn btn-sm btn-brown"
                              style={{ padding: '2px 8px', fontSize: '10px', fontWeight: '700' }}
                              title="Recalculate fastest alternative route using Dijkstra"
                            >
                              Recalculate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
