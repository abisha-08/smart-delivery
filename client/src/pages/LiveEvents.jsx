import React, { useState, useMemo } from 'react';
import StatusBadge from '../components/StatusBadge';
import { Radio, RefreshCw, Filter, Activity, Server, Zap } from 'lucide-react';
import { formatEventTimestamp } from '../utils/formatters';

export default function LiveEvents({
  events = [],
  countToday = 0,
  isSimulationRunning = false,
  onToggleSimulation,
  onRefresh,
  isLoading = false,
  onSelectShipmentByTracking = null
}) {
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filteredEvents = useMemo(() => {
    if (typeFilter === 'ALL') return events;
    return events.filter(e => e.type === typeFilter);
  }, [events, typeFilter]);

  const eventTypes = [
    { id: 'ALL', label: 'All Events', count: events.length },
    { id: 'RFID_SCAN', label: 'RFID Scans', count: events.filter(e => e.type === 'RFID_SCAN').length },
    { id: 'HUB_UPDATE', label: 'Hub Updates', count: events.filter(e => e.type === 'HUB_UPDATE').length },
    { id: 'DELAY_EVENT', label: 'Delay Alerts', count: events.filter(e => e.type === 'DELAY_EVENT').length },
    { id: 'ROUTE_UPDATE', label: 'Route Updates', count: events.filter(e => e.type === 'ROUTE_UPDATE').length },
    { id: 'PACKAGE_ARRIVAL', label: 'Arrivals', count: events.filter(e => e.type === 'PACKAGE_ARRIVAL').length },
    { id: 'SYNC', label: 'Sync Pulses', count: events.filter(e => e.type === 'SYNC').length }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Banner with Stats & Controls */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px'
      }}>
        {/* Total Events Monitored */}
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #FFB81C' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>
            Events Recorded
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#351C15', marginTop: '4px' }}>
            {events.length}
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
            Active in current operational window
          </div>
        </div>

        {/* Events Today */}
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #3B82F6' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>
            Throughput Rate
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#1D4ED8', marginTop: '4px' }}>
            ~15 / min
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
            Simulated IBM MQ ingestion rate
          </div>
        </div>

        {/* Legacy Scanner Health */}
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>
            Legacy Gateway Status
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isSimulationRunning ? '#22C55E' : '#9CA3AF'
            }} className={isSimulationRunning ? 'pulse-active' : ''} />
            <span style={{ fontSize: '16px', fontWeight: '700', color: isSimulationRunning ? '#166534' : '#4B5563' }}>
              {isSimulationRunning ? 'INGESTION ACTIVE' : 'INGESTION PAUSED'}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px' }}>
            5 Hub RFID Scanners connected
          </div>
        </div>
      </div>

      {/* Main Events Feed Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Filter Pills Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#FBFBFA'
        }}>
          {/* Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {eventTypes.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTypeFilter(tab.id)}
                style={{
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: typeFilter === tab.id ? '700' : '500',
                  color: typeFilter === tab.id ? '#351C15' : '#4B5563',
                  backgroundColor: typeFilter === tab.id ? '#FFB81C' : '#F3F4F6',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  fontSize: '10px',
                  backgroundColor: typeFilter === tab.id ? '#351C15' : '#E5E7EB',
                  color: typeFilter === tab.id ? '#FFFFFF' : '#374151',
                  padding: '1px 5px',
                  borderRadius: '10px',
                  fontWeight: '700'
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="btn btn-sm btn-outline"
          >
            <RefreshCw size={12} className={isLoading ? 'pulse-active' : ''} />
            <span>Refresh Feed</span>
          </button>
        </div>

        {/* Full Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 18px', width: '110px' }}>Timestamp</th>
                <th style={{ padding: '12px 18px', width: '150px' }}>Type</th>
                <th style={{ padding: '12px 18px', width: '120px' }}>Shipment</th>
                <th style={{ padding: '12px 18px' }}>Event Payload & Description</th>
                <th style={{ padding: '12px 18px', width: '140px', textAlign: 'right' }}>Source Origin</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: '#9CA3AF' }}>
                    No events found for this filter category.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt, idx) => (
                  <tr
                    key={evt.id || idx}
                    style={{
                      borderBottom: '1px solid #F3F4F6',
                      backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FCFCFB',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#FFFFFF' : '#FCFCFB'}
                  >
                    <td style={{ padding: '12px 18px', fontFamily: 'var(--font-mono)', color: '#64748B', whiteSpace: 'nowrap' }}>
                      {formatEventTimestamp(evt.timestamp)}
                    </td>

                    <td style={{ padding: '12px 18px', whiteSpace: 'nowrap' }}>
                      <StatusBadge status={evt.type} />
                    </td>

                    <td style={{ padding: '12px 18px', whiteSpace: 'nowrap' }}>
                      {evt.shipment_id ? (
                        <span
                          onClick={() => onSelectShipmentByTracking?.(evt.shipment_id)}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: '800',
                            color: '#351C15',
                            cursor: onSelectShipmentByTracking ? 'pointer' : 'default',
                            textDecoration: onSelectShipmentByTracking ? 'underline' : 'none'
                          }}
                        >
                          {evt.shipment_id}
                        </span>
                      ) : (
                        <span style={{ color: '#9CA3AF' }}>System Master</span>
                      )}
                    </td>

                    <td style={{ padding: '12px 18px', color: '#1F2937', fontWeight: '500' }}>
                      {evt.message}
                    </td>

                    <td style={{ padding: '12px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: '#F1F5F9',
                        color: '#475569',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {evt.source}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
