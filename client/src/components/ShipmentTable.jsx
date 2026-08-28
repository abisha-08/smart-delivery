import React, { useState, useMemo } from 'react';
import StatusBadge from './StatusBadge';
import { Search, Filter, ArrowRight, Eye, AlertTriangle } from 'lucide-react';
import { formatTime, formatDelayText } from '../utils/formatters';

export default function ShipmentTable({
  shipments = [],
  onSelectShipment,
  selectedShipmentId = null
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Filtered & Searched shipments
  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      // Status Filter
      if (statusFilter !== 'ALL' && s.status !== statusFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTracking = s.trackingNumber?.toLowerCase().includes(query);
        const matchesOrigin = s.origin?.toLowerCase().includes(query);
        const matchesDest = s.destination?.toLowerCase().includes(query);
        const matchesCurrent = s.currentLocation?.toLowerCase().includes(query);
        return matchesTracking || matchesOrigin || matchesDest || matchesCurrent;
      }

      return true;
    });
  }, [shipments, statusFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      ALL: shipments.length,
      ON_TRACK: shipments.filter((s) => s.status === 'ON_TRACK').length,
      AT_RISK: shipments.filter((s) => s.status === 'AT_RISK').length,
      DELAYED: shipments.filter((s) => s.status === 'DELAYED').length
    };
  }, [shipments]);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Controls Bar */}
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
        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '400px' }}>
          <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input
            type="text"
            placeholder="Search tracking number, origin, destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              fontSize: '13px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              outline: 'none',
              backgroundColor: '#FFFFFF'
            }}
          />
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#F3F4F6', padding: '3px', borderRadius: '6px' }}>
          {[
            { id: 'ALL', label: 'All', count: counts.ALL },
            { id: 'ON_TRACK', label: 'On Track', count: counts.ON_TRACK },
            { id: 'AT_RISK', label: 'At Risk', count: counts.AT_RISK },
            { id: 'DELAYED', label: 'Delayed', count: counts.DELAYED }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: statusFilter === tab.id ? '700' : '500',
                color: statusFilter === tab.id ? '#351C15' : '#6B7280',
                backgroundColor: statusFilter === tab.id ? '#FFFFFF' : 'transparent',
                borderRadius: '4px',
                boxShadow: statusFilter === tab.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                fontSize: '11px',
                padding: '1px 5px',
                borderRadius: '10px',
                backgroundColor: statusFilter === tab.id ? '#FFB81C' : '#E5E7EB',
                color: '#351C15',
                fontWeight: '700'
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Shipment Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: '11px', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 18px' }}>Tracking #</th>
              <th style={{ padding: '12px 18px' }}>Origin</th>
              <th style={{ padding: '12px 18px' }}>Current Location</th>
              <th style={{ padding: '12px 18px' }}>Destination</th>
              <th style={{ padding: '12px 18px' }}>ETA</th>
              <th style={{ padding: '12px 18px' }}>Deadline</th>
              <th style={{ padding: '12px 18px' }}>Delay</th>
              <th style={{ padding: '12px 18px' }}>Status</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredShipments.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: '#9CA3AF' }}>
                  No shipments match the current search or filter criteria.
                </td>
              </tr>
            ) : (
              filteredShipments.map((s, idx) => {
                const isSelected = selectedShipmentId === s.id || selectedShipmentId === s.trackingNumber;

                return (
                  <tr
                    key={s.id || s.trackingNumber}
                    onClick={() => onSelectShipment(s)}
                    style={{
                      borderBottom: '1px solid #F3F4F6',
                      backgroundColor: isSelected ? '#FFFBEB' : (idx % 2 === 0 ? '#FFFFFF' : '#FCFCFB'),
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#FFFFFF' : '#FCFCFB';
                    }}
                  >
                    {/* Tracking Number */}
                    <td style={{ padding: '12px 18px', fontFamily: 'var(--font-mono)', fontWeight: '800', color: '#351C15' }}>
                      {s.trackingNumber}
                    </td>

                    {/* Origin */}
                    <td style={{ padding: '12px 18px', color: '#4B5563', fontWeight: '500' }}>
                      {s.origin}
                    </td>

                    {/* Current Location */}
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{
                        backgroundColor: '#F3F4F6',
                        color: '#1F2937',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontWeight: '600',
                        fontSize: '12px'
                      }}>
                        {s.currentLocation} Hub
                      </span>
                    </td>

                    {/* Destination */}
                    <td style={{ padding: '12px 18px', color: '#4B5563', fontWeight: '500' }}>
                      {s.destination}
                    </td>

                    {/* ETA */}
                    <td style={{
                      padding: '12px 18px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '700',
                      color: s.status === 'DELAYED' ? '#DC2626' : s.status === 'AT_RISK' ? '#D97706' : '#16A34A'
                    }}>
                      {formatTime(s.eta)}
                    </td>

                    {/* Deadline */}
                    <td style={{ padding: '12px 18px', fontFamily: 'var(--font-mono)', fontWeight: '600', color: '#4B5563' }}>
                      {formatTime(s.deadline)}
                    </td>

                    {/* Delay */}
                    <td style={{ padding: '12px 18px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      {s.delayMinutes > 0 ? (
                        <span style={{ color: s.status === 'DELAYED' ? '#DC2626' : '#D97706', fontWeight: '700' }}>
                          +{s.delayMinutes}m
                        </span>
                      ) : (
                        <span style={{ color: '#16A34A', fontWeight: '600' }}>On time</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '12px 18px' }}>
                      <StatusBadge status={s.status} />
                    </td>

                    {/* Action */}
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectShipment(s);
                        }}
                        style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '700' }}
                      >
                        <Eye size={12} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
