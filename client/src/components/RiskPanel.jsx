import React from 'react';
import StatusBadge from './StatusBadge';
import { AlertTriangle, Clock, ArrowRight, Eye, ShieldAlert } from 'lucide-react';
import { formatTime } from '../utils/formatters';

export default function RiskPanel({
  shipments = [],
  onSelectShipment
}) {
  // Prioritize DELAYED first, then AT_RISK
  const atRiskList = shipments
    .filter(s => s.status === 'DELAYED' || s.status === 'AT_RISK')
    .sort((a, b) => {
      if (a.status === 'DELAYED' && b.status !== 'DELAYED') return -1;
      if (b.status === 'DELAYED' && a.status !== 'DELAYED') return 1;
      return (b.delayMinutes || 0) - (a.delayMinutes || 0);
    });

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
            backgroundColor: '#FEF3C7',
            color: '#D97706',
            padding: '5px',
            borderRadius: '6px'
          }}>
            <ShieldAlert size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#351C15' }}>
              At-Risk Shipments
            </h2>
            <div style={{ fontSize: '11px', color: '#6B7280' }}>
              Requires Dispatcher Attention ({atRiskList.length})
            </div>
          </div>
        </div>

        <span style={{
          fontSize: '11px',
          fontWeight: '700',
          backgroundColor: atRiskList.length > 0 ? '#FEE2E2' : '#DCFCE7',
          color: atRiskList.length > 0 ? '#DC2626' : '#166534',
          padding: '3px 8px',
          borderRadius: '4px'
        }}>
          {atRiskList.length} Flagged
        </span>
      </div>

      {/* List Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {atRiskList.length === 0 ? (
          <div style={{
            padding: '36px 20px',
            textAlign: 'center',
            color: '#6B7280'
          }}>
            <div style={{ fontWeight: '600', fontSize: '14px', color: '#166534' }}>✓ All Shipments On Track</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>No shipments currently threatening delivery SLAs.</div>
          </div>
        ) : (
          atRiskList.map((s) => {
            const isDelayed = s.status === 'DELAYED';

            return (
              <div
                key={s.id || s.trackingNumber}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: `1px solid ${isDelayed ? '#FECACA' : '#FDE68A'}`,
                  borderLeft: `4px solid ${isDelayed ? '#DC2626' : '#D97706'}`,
                  borderRadius: '8px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'background-color 0.15s ease'
                }}
              >
                {/* Top Row: Tracking & Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontWeight: '800',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '13px',
                      color: '#111827'
                    }}>
                      {s.trackingNumber}
                    </span>
                    <StatusBadge status={s.status} />
                  </div>

                  <button
                    onClick={() => onSelectShipment(s)}
                    className="btn btn-sm btn-outline"
                    style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#351C15'
                    }}
                  >
                    <Eye size={12} />
                    <span>VIEW</span>
                  </button>
                </div>

                {/* Corridor */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#4B5563' }}>
                  <span style={{ fontWeight: '600' }}>{s.currentLocation || s.origin}</span>
                  <ArrowRight size={12} color="#9CA3AF" />
                  <span style={{ fontWeight: '600' }}>{s.destination}</span>
                </div>

                {/* Timing & Delay Difference */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#F9FAFB',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '11px'
                }}>
                  <div style={{ color: '#4B5563' }}>
                    ETA: <strong style={{ color: isDelayed ? '#DC2626' : '#D97706', fontFamily: 'var(--font-mono)' }}>{formatTime(s.eta)}</strong>
                    <span style={{ margin: '0 4px', color: '#D1D5DB' }}>|</span>
                    SLA: <strong style={{ fontFamily: 'var(--font-mono)' }}>{formatTime(s.deadline)}</strong>
                  </div>

                  <div style={{
                    fontWeight: '700',
                    color: isDelayed ? '#DC2626' : '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <AlertTriangle size={12} />
                    <span>+{s.delayMinutes || 15}m behind</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
