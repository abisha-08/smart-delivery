import React from 'react';
import StatusBadge from './StatusBadge';
import { Radio, ArrowRight, Activity, Clock } from 'lucide-react';
import { formatEventTimestamp } from '../utils/formatters';

export default function EventFeed({
  events = [],
  onViewAll,
  maxItems = null,
  showViewAllButton = false,
  onSelectShipmentByTracking = null
}) {
  const displayEvents = maxItems ? events.slice(0, maxItems) : events;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FBFBFA'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            backgroundColor: '#DBEAFE',
            color: '#1D4ED8',
            padding: '5px',
            borderRadius: '6px'
          }}>
            <Activity size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#351C15' }}>
              Live Legacy & RFID Stream
            </h2>
            <div style={{ fontSize: '11px', color: '#6B7280' }}>
              IBM MQ • RFID Scanners • Hub Gateway Integration
            </div>
          </div>
        </div>

        {showViewAllButton && onViewAll && (
          <button
            onClick={onViewAll}
            className="btn btn-sm btn-outline"
            style={{ fontSize: '11px', fontWeight: '700' }}
          >
            <span>VIEW ALL EVENTS</span>
            <ArrowRight size={12} />
          </button>
        )}
      </div>

      {/* Events Table / List */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: '11px', textTransform: 'uppercase' }}>
              <th style={{ padding: '10px 16px', width: '90px' }}>Time</th>
              <th style={{ padding: '10px 16px', width: '130px' }}>Type</th>
              <th style={{ padding: '10px 16px', width: '110px' }}>Shipment</th>
              <th style={{ padding: '10px 16px' }}>Event Message</th>
              <th style={{ padding: '10px 16px', width: '120px', textAlign: 'right' }}>Source</th>
            </tr>
          </thead>
          <tbody>
            {displayEvents.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>
                  No system events recorded. Enable simulation in header to generate live RFID feed.
                </td>
              </tr>
            ) : (
              displayEvents.map((evt, idx) => (
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
                  {/* Timestamp */}
                  <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', color: '#64748B', whiteSpace: 'nowrap' }}>
                    {formatEventTimestamp(evt.timestamp)}
                  </td>

                  {/* Type */}
                  <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                    <StatusBadge status={evt.type} />
                  </td>

                  {/* Shipment Tracking */}
                  <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                    {evt.shipment_id ? (
                      <span
                        onClick={() => onSelectShipmentByTracking?.(evt.shipment_id)}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '700',
                          color: '#351C15',
                          cursor: onSelectShipmentByTracking ? 'pointer' : 'default',
                          textDecoration: onSelectShipmentByTracking ? 'underline' : 'none'
                        }}
                      >
                        {evt.shipment_id}
                      </span>
                    ) : (
                      <span style={{ color: '#9CA3AF' }}>—</span>
                    )}
                  </td>

                  {/* Message */}
                  <td style={{ padding: '10px 16px', color: '#1F2937', fontWeight: '500' }}>
                    {evt.message}
                  </td>

                  {/* Source */}
                  <td style={{ padding: '10px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      backgroundColor: '#F1F5F9',
                      color: '#475569',
                      padding: '2px 6px',
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
  );
}
