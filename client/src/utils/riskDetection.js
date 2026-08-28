/**
 * Client-side Risk Detection Utility
 * Mirrors backend risk engine logic for offline previews and instantaneous UI calculations.
 */

export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  if (timeStr.includes(':')) {
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  }
  const date = new Date(timeStr);
  if (!isNaN(date.getTime())) {
    return date.getHours() * 60 + date.getMinutes();
  }
  return 0;
}

export function addMinutesToTimeString(timeStr, minutesToAdd) {
  if (!timeStr || !timeStr.includes(':')) {
    return timeStr || '12:00';
  }
  const totalMins = parseTimeToMinutes(timeStr) + minutesToAdd;
  const wrappedMins = ((totalMins % 1440) + 1440) % 1440;
  const hours = Math.floor(wrappedMins / 60);
  const mins = wrappedMins % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function evaluateShipmentStatus(eta, deadline, delayMinutes = 0) {
  const etaMins = parseTimeToMinutes(eta);
  const deadlineMins = parseTimeToMinutes(deadline);
  const diffMinutes = etaMins - deadlineMins;

  // Severe delay threshold >= 30 min delay or ETA exceeds deadline by 25+ min
  if (delayMinutes >= 30 || diffMinutes >= 25) {
    return 'DELAYED';
  }

  // At risk if delay is present or ETA is after deadline
  if (diffMinutes > 0 || delayMinutes > 0) {
    return 'AT_RISK';
  }

  return 'ON_TRACK';
}
