import React from 'react';
import {
  LayoutDashboard,
  Package,
  Network as NetworkIcon,
  Radio,
  Settings,
  Box,
  Wifi,
  WifiOff
} from 'lucide-react';

export default function Sidebar({
  currentPage,
  onNavigate,
  isOffline,
  pendingCount = 0
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'shipments', label: 'Shipments', icon: Package },
    { id: 'network', label: 'Network', icon: NetworkIcon },
    { id: 'events', label: 'Live Events', icon: Radio },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          backgroundColor: '#FFB81C',
          width: '38px',
          height: '38px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(255, 184, 28, 0.4)',
          flexShrink: 0
        }}>
          <Box size={22} color="#351C15" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{
            fontSize: '14px',
            fontWeight: '800',
            letterSpacing: '0.04em',
            color: '#FFFFFF',
            lineHeight: 1.1
          }}>
            SMART DELIVERY
          </div>
          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#FFB81C',
            letterSpacing: '0.02em',
            marginTop: '2px'
          }}>
            Delay Intelligence
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{
          fontSize: '10px',
          fontWeight: '700',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.4)',
          padding: '8px 12px 4px 12px',
          letterSpacing: '0.05em'
        }}>
          Operations
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: isActive ? '700' : '500',
                color: isActive ? '#351C15' : 'rgba(255, 255, 255, 0.85)',
                backgroundColor: isActive ? '#FFB81C' : 'transparent',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
              {item.id === 'events' && (
                <span style={{
                  marginLeft: 'auto',
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#22C55E'
                }} className="pulse-active" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Connection / Status Footer */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(0, 0, 0, 0.15)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isOffline ? (
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#F59E0B'
              }} />
            ) : (
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#22C55E'
              }} className="pulse-active" />
            )}
            <span style={{
              fontSize: '12px',
              fontWeight: '700',
              color: isOffline ? '#FBBF24' : '#4ADE80',
              letterSpacing: '0.03em'
            }}>
              {isOffline ? '⚠ OFFLINE' : '● ONLINE'}
            </span>
          </div>

          {pendingCount > 0 && (
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              backgroundColor: '#FFB81C',
              color: '#351C15',
              padding: '1px 6px',
              borderRadius: '10px'
            }}>
              {pendingCount} queued
            </span>
          )}
        </div>

        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Hubs Connected: 5</span>
          <span>v2.4 Command</span>
        </div>
      </div>
    </aside>
  );
}
