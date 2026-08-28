import React from 'react';

export default function KPICard({
  label,
  value,
  icon: Icon,
  indicator,
  variant = 'default',
  onClick
}) {
  const getTheme = () => {
    switch (variant) {
      case 'at-risk':
        return {
          iconBg: '#FEF3C7',
          iconColor: '#D97706',
          borderLeft: '4px solid #D97706',
          valueColor: '#B45309'
        };
      case 'delayed':
        return {
          iconBg: '#FEE2E2',
          iconColor: '#DC2626',
          borderLeft: '4px solid #DC2626',
          valueColor: '#991B1B'
        };
      case 'transit':
        return {
          iconBg: '#EFF6FF',
          iconColor: '#2563EB',
          borderLeft: '4px solid #2563EB',
          valueColor: '#1E40AF'
        };
      case 'gold':
      default:
        return {
          iconBg: '#FFF4D9',
          iconColor: '#351C15',
          borderLeft: '4px solid #FFB81C',
          valueColor: '#351C15'
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        padding: '20px 22px',
        borderLeft: theme.borderLeft,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.08)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{
          fontSize: '12px',
          fontWeight: '700',
          letterSpacing: '0.04em',
          color: '#6B7280',
          textTransform: 'uppercase'
        }}>
          {label}
        </span>
        <div style={{
          backgroundColor: theme.iconBg,
          color: theme.iconColor,
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {Icon && <Icon size={20} strokeWidth={2.2} />}
        </div>
      </div>

      <div>
        <div style={{
          fontSize: '32px',
          fontWeight: '800',
          fontFamily: 'var(--font-mono)',
          color: theme.valueColor,
          lineHeight: 1.1,
          marginBottom: '6px'
        }}>
          {value !== undefined && value !== null ? value : '--'}
        </div>

        {indicator && (
          <div style={{
            fontSize: '12px',
            color: '#6B7280',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {indicator}
          </div>
        )}
      </div>
    </div>
  );
}
