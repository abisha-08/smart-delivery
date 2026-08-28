/**
 * Formatters and Presentation Utilities
 */

export function formatDelayText(delayMinutes) {
  const mins = parseInt(delayMinutes, 10) || 0;
  if (mins === 0) return 'On Schedule';
  if (mins > 0) return `+${mins} min delay`;
  return `${mins} min early`;
}

export function formatTime(timeStr) {
  if (!timeStr) return '--:--';
  if (timeStr.includes(':')) {
    const parts = timeStr.split(':');
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  const date = new Date(timeStr);
  if (!isNaN(date.getTime())) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return timeStr;
}

export function formatEventTimestamp(isoStr) {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) return isoStr;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatStatusLabel(status) {
  switch (status) {
    case 'ON_TRACK':
      return 'ON TRACK';
    case 'AT_RISK':
      return 'AT RISK';
    case 'DELAYED':
      return 'DELAYED';
    case 'OPERATIONAL':
      return 'OPERATIONAL';
    default:
      return status?.replace('_', ' ') || 'UNKNOWN';
  }
}

export function getStatusColorClass(status) {
  switch (status) {
    case 'ON_TRACK':
      return 'badge-on-track';
    case 'AT_RISK':
      return 'badge-at-risk';
    case 'DELAYED':
      return 'badge-delayed';
    case 'INFO':
    case 'RFID_SCAN':
    case 'PACKAGE_ARRIVAL':
      return 'badge-info';
    case 'SYNC':
      return 'badge-sync';
    default:
      return 'badge-neutral';
  }
}
