import React from 'react';
import { WifiOff, RefreshCw, Database } from 'lucide-react';

export default function OfflineBanner({
  isOffline,
  pendingCount = 0,
  isSyncing = false,
  onSync
}) {
  if (!isOffline && pendingCount === 0) return null;

  return (
    <div style={{
      backgroundColor: isOffline ? '#FEF3C7' : '#F0FDF4',
      borderBottom: `1px solid ${isOffline ? '#FDE68A' : '#BBF7D0'}`,
      color: isOffline ? '#92400E' : '#166534',
      padding: '10px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '13px',
      fontWeight: '500',
      zIndex: 20
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isOffline ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
            <WifiOff size={16} />
            <span>⚠ OFFLINE MODE</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
            <Database size={16} />
            <span>LOCAL QUEUE ACTIVE</span>
          </div>
        )}
        <span style={{ opacity: 0.9 }}>
          {isOffline
            ? 'Internet connection unavailable. Operations continue using locally stored data. Changes will synchronize when connectivity returns.'
            : 'Unsynchronized offline actions ready for upload.'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <span style={{
          backgroundColor: isOffline ? '#FDE68A' : '#DCFCE7',
          padding: '2px 8px',
          borderRadius: '4px',
          fontWeight: '700',
          fontSize: '12px'
        }}>
          Pending Sync: {pendingCount}
        </span>

        {pendingCount > 0 && (
          <button
            className="btn btn-sm"
            onClick={onSync}
            disabled={isSyncing}
            style={{
              backgroundColor: '#351C15',
              color: '#FFFFFF',
              padding: '4px 10px',
              fontSize: '12px'
            }}
          >
            <RefreshCw size={12} className={isSyncing ? 'pulse-active' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>
    </div>
  );
}
