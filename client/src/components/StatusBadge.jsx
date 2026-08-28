import React from 'react';
import { getStatusColorClass, formatStatusLabel } from '../utils/formatters';
import { CheckCircle2, AlertTriangle, AlertOctagon, Radio, RefreshCw, Info } from 'lucide-react';

export default function StatusBadge({ status, type = 'status' }) {
  const colorClass = getStatusColorClass(status);
  const label = formatStatusLabel(status);

  const getIcon = () => {
    switch (status) {
      case 'ON_TRACK':
        return <CheckCircle2 size={12} />;
      case 'AT_RISK':
        return <AlertTriangle size={12} />;
      case 'DELAYED':
        return <AlertOctagon size={12} />;
      case 'RFID_SCAN':
      case 'PACKAGE_ARRIVAL':
        return <Radio size={12} />;
      case 'SYNC':
        return <RefreshCw size={12} />;
      case 'ROUTE_UPDATE':
        return <CheckCircle2 size={12} />;
      default:
        return <Info size={12} />;
    }
  };

  return (
    <span className={`badge ${colorClass}`}>
      {getIcon()}
      <span>{label}</span>
    </span>
  );
}
