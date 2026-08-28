import React from 'react';
import {
  Play,
  Pause,
  Wifi,
  WifiOff,
  UserCheck,
  RefreshCw,
  Zap
} from 'lucide-react';

export default function Header({
  pageTitle,
  pageSubtitle,
  isSimulationRunning,
  onToggleSimulation,
  isSimulatedOffline,
  onToggleSimulatedOffline,
  isOnline,
  pendingCount = 0,
  onManualSync,
  isSyncing = false
}) {
  const effectiveOffline = isSimulatedOffline || !isOnline;

  return (
    <header className="header">
      {/* Left: Title & Subtitle */}
      <div>
        <h1 style={{
          fontSize: '20px',
          fontWeight: '800',
          color: '#351C15',
          lineHeight: 1.2
        }}>
          {pageTitle}
        </h1>
        <p style={{
          fontSize: '13px',
          color: '#5F6662',
          marginTop: '2px'
        }}>
          {pageSubtitle}
        </p>
      </div>

      {/* Right: Controls & Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Live Legacy Simulation Toggle */}
        <button
          onClick={onToggleSimulation}
          className="btn btn-outline"
          style={{
            borderColor: isSimulationRunning ? '#BBF7D0' : '#E5E7EB',
            backgroundColor: isSimulationRunning ? '#F0FDF4' : '#FFFFFF',
            color: isSimulationRunning ? '#166534' : '#374151'
          }}
          title={isSimulationRunning ? 'Pause live legacy RFID simulation' : 'Start live legacy RFID simulation'}
        >
          {isSimulationRunning ? (
            <>
              <Pause size={14} color="#16A34A" />
              <span>SIMULATION: <strong style={{ color: '#16A34A' }}>ACTIVE</strong></span>
            </>
          ) : (
            <>
              <Play size={14} color="#6B7280" />
              <span>SIMULATION: <strong style={{ color: '#6B7280' }}>PAUSED</strong></span>
            </>
          )}
        </button>

        {/* Demo Simulate Offline / Online Toggle */}
        <button
          onClick={onToggleSimulatedOffline}
          className={`btn ${effectiveOffline ? 'btn-primary' : 'btn-outline'}`}
          style={{
            borderColor: effectiveOffline ? '#FFB81C' : '#E5E7EB',
            fontWeight: '700'
          }}
          title="Toggle simulated offline mode for hackathon demonstration"
        >
          {effectiveOffline ? (
            <>
              <Wifi size={15} />
              <span>SIMULATE ONLINE</span>
            </>
          ) : (
            <>
              <WifiOff size={15} color="#D97706" />
              <span>SIMULATE OFFLINE</span>
            </>
          )}
        </button>

        {/* Quick Sync Button if queued items exist */}
        {pendingCount > 0 && !effectiveOffline && (
          <button
            onClick={onManualSync}
            disabled={isSyncing}
            className="btn btn-brown btn-sm"
            title="Reconcile queued offline actions to backend database"
          >
            <RefreshCw size={13} className={isSyncing ? 'pulse-active' : ''} />
            <span>Sync ({pendingCount})</span>
          </button>
        )}

        {/* Operator Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          backgroundColor: '#F3F4F6',
          borderRadius: '8px',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{
            backgroundColor: '#351C15',
            color: '#FFFFFF',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: '700'
          }}>
            OP
          </div>
          <div style={{ fontSize: '12px', lineHeight: 1.1 }}>
            <div style={{ fontWeight: '700', color: '#111827' }}>Operator 802</div>
            <div style={{ fontSize: '10px', color: '#6B7280' }}>Command Dispatch</div>
          </div>
        </div>
      </div>
    </header>
  );
}
