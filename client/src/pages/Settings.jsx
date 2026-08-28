import React, { useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  Server,
  Database,
  HardDrive,
  Radio,
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { offlineStorage } from '../services/offlineStorage';
import { formatEventTimestamp } from '../utils/formatters';

export default function Settings({
  backendStatus = 'OK',
  isOnline = true,
  isSimulatedOffline = false,
  isSimulationRunning = false,
  pendingQueue = [],
  onClearCache,
  onResetDemoData,
  onManualSync,
  isSyncing = false
}) {
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);
  const [showResetDemoModal, setShowResetDemoModal] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px' }}>
      
      {/* System Status Overview */}
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#351C15', marginBottom: '6px' }}>
          Platform System & Runtime Diagnostics
        </h2>
        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
          Real-time status of backend services, SQLite persistence layer, and offline synchronization queues.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px'
        }}>
          {/* Backend Connection */}
          <div style={{ backgroundColor: '#F9FAFB', padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4B5563', fontSize: '12px', fontWeight: '600' }}>
              <Server size={16} color="#351C15" />
              <span>Backend Service</span>
            </div>
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: backendStatus === 'OK' ? '#22C55E' : '#DC2626'
              }} className={backendStatus === 'OK' ? 'pulse-active' : ''} />
              <span style={{ fontSize: '14px', fontWeight: '700', color: backendStatus === 'OK' ? '#166534' : '#991B1B' }}>
                {backendStatus === 'OK' ? 'Connected (Node.js Express)' : 'Unavailable'}
              </span>
            </div>
          </div>

          {/* Database */}
          <div style={{ backgroundColor: '#F9FAFB', padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4B5563', fontSize: '12px', fontWeight: '600' }}>
              <Database size={16} color="#351C15" />
              <span>Persistent Storage</span>
            </div>
            <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: '700', color: '#111827' }}>
              SQLite (better-sqlite3)
            </div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
              WAL Journal Mode Enabled
            </div>
          </div>

          {/* Local Storage */}
          <div style={{ backgroundColor: '#F9FAFB', padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4B5563', fontSize: '12px', fontWeight: '600' }}>
              <HardDrive size={16} color="#351C15" />
              <span>Client Cache (localStorage)</span>
            </div>
            <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: '700', color: '#166534' }}>
              Active & Synced
            </div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
              Automatic Fallback Enabled
            </div>
          </div>

          {/* Live Simulation */}
          <div style={{ backgroundColor: '#F9FAFB', padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4B5563', fontSize: '12px', fontWeight: '600' }}>
              <Radio size={16} color="#351C15" />
              <span>Live RFID Simulation</span>
            </div>
            <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: '700', color: isSimulationRunning ? '#166534' : '#6B7280' }}>
              {isSimulationRunning ? 'Active (Pulse ~3.5s)' : 'Paused'}
            </div>
          </div>

          {/* Connection */}
          <div style={{ backgroundColor: '#F9FAFB', padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4B5563', fontSize: '12px', fontWeight: '600' }}>
              {isOnline && !isSimulatedOffline ? <Wifi size={16} color="#16A34A" /> : <WifiOff size={16} color="#D97706" />}
              <span>Network State</span>
            </div>
            <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: '700', color: isOnline && !isSimulatedOffline ? '#166534' : '#D97706' }}>
              {isSimulatedOffline ? 'SIMULATED OFFLINE' : isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>
          </div>

          {/* Pending Sync */}
          <div style={{ backgroundColor: '#F9FAFB', padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4B5563', fontSize: '12px', fontWeight: '600' }}>
              <RefreshCw size={16} color="#351C15" />
              <span>Pending Sync Queue</span>
            </div>
            <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: pendingQueue.length > 0 ? '#D97706' : '#166534' }}>
              {pendingQueue.length} action(s)
            </div>
          </div>
        </div>
      </div>

      {/* Pending Sync Actions Queue */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#351C15' }}>
              Offline Action Queue ({pendingQueue.length})
            </h3>
            <p style={{ fontSize: '12px', color: '#6B7280' }}>
              Actions executed locally while offline that will synchronize upon reconnection.
            </p>
          </div>

          {pendingQueue.length > 0 && (
            <button
              className="btn btn-primary btn-sm"
              onClick={onManualSync}
              disabled={isSyncing}
            >
              <RefreshCw size={13} className={isSyncing ? 'pulse-active' : ''} />
              <span>{isSyncing ? 'Syncing...' : 'Sync All to Database'}</span>
            </button>
          )}
        </div>

        {pendingQueue.length === 0 ? (
          <div style={{
            backgroundColor: '#F9FAFB',
            padding: '24px',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#6B7280',
            fontSize: '13px'
          }}>
            <CheckCircle2 size={24} color="#16A34A" style={{ margin: '0 auto 8px auto' }} />
            <div>Queue is clean. All local modifications are synchronized with SQLite.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280', textTransform: 'uppercase', fontSize: '11px' }}>
                  <th style={{ padding: '10px 14px' }}>Action ID</th>
                  <th style={{ padding: '10px 14px' }}>Type</th>
                  <th style={{ padding: '10px 14px' }}>Target Shipment</th>
                  <th style={{ padding: '10px 14px' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {pendingQueue.map((item, idx) => (
                  <tr key={item.id || idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{item.id}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                        {item.type}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)' }}>{item.shipmentId || item.trackingNumber || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#64748B' }}>{formatEventTimestamp(item.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Operational Maintenance & Demo Recovery */}
      <div className="card" style={{ padding: '24px', borderLeft: '4px solid #D97706' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#351C15', marginBottom: '4px' }}>
          Demo Maintenance & Reset Controls
        </h3>
        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
          Use these controls during judge demonstrations to reset or clear local storage.
        </p>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline"
            onClick={() => setShowClearCacheModal(true)}
            style={{ color: '#4B5563' }}
          >
            <Trash2 size={15} />
            <span>CLEAR LOCAL CACHE</span>
          </button>

          <button
            className="btn btn-primary"
            onClick={() => setShowResetDemoModal(true)}
            style={{ fontWeight: '700' }}
          >
            <RotateCcw size={15} />
            <span>RESET DEMO DATA</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal: Clear Cache */}
      <ConfirmDialog
        isOpen={showClearCacheModal}
        title="Clear Local Cache"
        message="This will clear your browser's cached shipments, events, and pending offline actions. It will not delete the backend SQLite database. Do you wish to continue?"
        confirmLabel="Clear Cache"
        onConfirm={() => {
          setShowClearCacheModal(false);
          onClearCache();
        }}
        onCancel={() => setShowClearCacheModal(false)}
      />

      {/* Confirmation Modal: Reset Demo Data */}
      <ConfirmDialog
        isOpen={showResetDemoModal}
        title="Reset Demo Data to Initial State"
        message="This will restore all 12 shipments (including UPS1002 in Denver at risk), 5 hubs, and routes in SQLite to their initial seed state, clear local queue, and reload the platform. Proceed?"
        confirmLabel="Reset Everything"
        isDestructive={true}
        onConfirm={() => {
          setShowResetDemoModal(false);
          onResetDemoData();
        }}
        onCancel={() => setShowResetDemoModal(false)}
      />

    </div>
  );
}
