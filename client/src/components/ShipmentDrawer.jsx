import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import {
  X,
  Clock,
  MapPin,
  ArrowRight,
  TrendingDown,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Zap,
  RotateCcw
} from 'lucide-react';
import { formatTime, formatDelayText, formatEventTimestamp } from '../utils/formatters';

export default function ShipmentDrawer({
  shipment,
  onClose,
  onSimulateDelay,
  onRecalculateRoute,
  onApplyRoute,
  events = [],
  isCalculating = false,
  isApplying = false,
  isDelaying = false
}) {
  const [recalcResult, setRecalcResult] = useState(null);
  const [calculatingLocal, setCalculatingLocal] = useState(false);

  if (!shipment) return null;

  // Filter events related to this shipment
  const shipmentEvents = events.filter(
    (e) => e.shipment_id === shipment.trackingNumber || e.shipment_id === shipment.id
  );

  const handleRecalculate = async () => {
    setCalculatingLocal(true);
    try {
      const res = await onRecalculateRoute(shipment.id || shipment.trackingNumber);
      if (res) {
        setRecalcResult(res);
      }
    } finally {
      setCalculatingLocal(false);
    }
  };

  const handleApply = async () => {
    await onApplyRoute(shipment.id || shipment.trackingNumber);
    setRecalcResult(null);
  };

  const hasRecommended = !!(shipment.recommendedRoute || recalcResult?.path);
  const recommendedPath = shipment.recommendedRoute || recalcResult?.path;
  const travelTime = recalcResult?.travelTimeMinutes || 230;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FBFBFA'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '800',
                fontFamily: 'var(--font-mono)',
                color: '#351C15'
              }}>
                {shipment.trackingNumber}
              </h2>
              <StatusBadge status={shipment.status} />
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
              Origin: <strong>{shipment.origin}</strong> • Priority Freight
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '6px',
              color: '#6B7280',
              backgroundColor: '#F3F4F6'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Location & Time Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            backgroundColor: '#F9FAFB',
            padding: '16px',
            borderRadius: '10px',
            border: '1px solid #E5E7EB'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' }}>Current Location</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={14} color="#FFB81C" />
                <span>{shipment.currentLocation} Hub</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' }}>Destination</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={14} color="#351C15" />
                <span>{shipment.destination} Hub</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '10px', marginTop: '4px' }}>
              <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' }}>Estimated ETA</div>
              <div style={{ fontSize: '15px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: shipment.status === 'DELAYED' ? '#DC2626' : shipment.status === 'AT_RISK' ? '#D97706' : '#16A34A', marginTop: '2px' }}>
                {formatTime(shipment.eta)}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '10px', marginTop: '4px' }}>
              <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' }}>Committed Deadline</div>
              <div style={{ fontSize: '15px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#374151', marginTop: '2px' }}>
                {formatTime(shipment.deadline)}
              </div>
            </div>
          </div>

          {/* Delay Status Alert */}
          {shipment.delayMinutes > 0 ? (
            <div style={{
              backgroundColor: shipment.status === 'DELAYED' ? '#FEF2F2' : '#FFFBEB',
              border: `1px solid ${shipment.status === 'DELAYED' ? '#FECACA' : '#FDE68A'}`,
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} color={shipment.status === 'DELAYED' ? '#DC2626' : '#D97706'} />
                <span style={{ fontSize: '13px', fontWeight: '700', color: shipment.status === 'DELAYED' ? '#991B1B' : '#92400E' }}>
                  {formatDelayText(shipment.delayMinutes)}
                </span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#6B7280' }}>
                {shipment.status === 'DELAYED' ? 'Exceeds SLA threshold' : 'Delivery at risk'}
              </span>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={16} color="#16A34A" />
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#166534' }}>
                Package is currently moving on schedule
              </span>
            </div>
          )}

          {/* Active Route Visual */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#4B5563', textTransform: 'uppercase', marginBottom: '10px' }}>
              Active Routing
            </div>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              {(shipment.route || [shipment.origin, shipment.destination]).map((hub, idx, arr) => (
                <React.Fragment key={idx}>
                  <div style={{
                    backgroundColor: hub === shipment.currentLocation ? '#FFB81C' : '#F3F4F6',
                    color: hub === shipment.currentLocation ? '#351C15' : '#374151',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {hub === shipment.currentLocation && <Radio size={12} className="pulse-active" />}
                    <span>{hub}</span>
                  </div>
                  {idx < arr.length - 1 && (
                    <ArrowRight size={14} color="#9CA3AF" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Recommended Route (Dijkstra) Box */}
          {hasRecommended && (
            <div style={{
              backgroundColor: '#ECFDF5',
              border: '2px solid #10B981',
              borderRadius: '10px',
              padding: '16px',
              animation: 'popIn 0.2s ease-out'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#065F46', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={14} color="#10B981" />
                  FASTEST AVAILABLE ROUTE
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  backgroundColor: '#D1FAE5',
                  color: '#065F46',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {travelTime} min (Dijkstra)
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', margin: '10px 0' }}>
                {recommendedPath.map((hub, idx, arr) => (
                  <React.Fragment key={idx}>
                    <span style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #6EE7B7',
                      color: '#065F46',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700'
                    }}>
                      {hub}
                    </span>
                    {idx < arr.length - 1 && (
                      <ArrowRight size={13} color="#10B981" />
                    )}
                  </React.Fragment>
                ))}
              </div>

              <button
                className="btn btn-primary"
                onClick={handleApply}
                disabled={isApplying}
                style={{ width: '100%', marginTop: '6px' }}
              >
                <CheckCircle2 size={15} />
                {isApplying ? 'Applying Alternative Route...' : 'APPLY ROUTE'}
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              className="btn btn-outline"
              onClick={() => onSimulateDelay(shipment.id || shipment.trackingNumber)}
              disabled={isDelaying}
              style={{
                justifyContent: 'center',
                borderColor: '#FCA5A5',
                color: '#DC2626',
                backgroundColor: '#FFF'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFF'}
            >
              <TrendingDown size={15} />
              {isDelaying ? 'Injecting Delay...' : 'SIMULATE DELAY (+20 min)'}
            </button>

            <button
              className="btn btn-brown"
              onClick={handleRecalculate}
              disabled={isCalculating || calculatingLocal}
              style={{ justifyContent: 'center' }}
            >
              <Navigation size={15} />
              {isCalculating || calculatingLocal ? 'Analyzing network (Dijkstra)...' : 'RECALCULATE FASTEST ROUTE'}
            </button>
          </div>

          {/* Event Timeline */}
          <div style={{ marginTop: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#351C15', marginBottom: '12px' }}>
              Shipment Event Timeline ({shipmentEvents.length})
            </div>

            {shipmentEvents.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic', padding: '10px 0' }}>
                No recent RFID or legacy events for this shipment.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', paddingLeft: '16px' }}>
                <div style={{
                  position: 'absolute',
                  left: '6px',
                  top: '6px',
                  bottom: '6px',
                  width: '2px',
                  backgroundColor: '#E5E7EB'
                }} />

                {shipmentEvents.map((evt, idx) => (
                  <div key={evt.id || idx} style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: '-16px',
                      top: '5px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: evt.type === 'DELAY_EVENT' ? '#DC2626' : evt.type === 'ROUTE_UPDATE' ? '#10B981' : '#351C15'
                    }} />
                    <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>
                      {formatEventTimestamp(evt.timestamp)} • <span style={{ textTransform: 'uppercase' }}>{evt.source}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#1F2937', fontWeight: '500', marginTop: '2px' }}>
                      {evt.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
