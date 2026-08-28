/**
 * Centralized Risk Engine for UPS Smart Delivery Platform
 * 
 * Rules:
 * - ETA <= deadline AND delayMinutes === 0  => ON_TRACK
 * - ETA slightly after deadline OR 0 < delayMinutes < 30 => AT_RISK
 * - delayMinutes >= 30 OR ETA > deadline + 25m => DELAYED
 */

/**
 * Parses HH:mm or ISO string into total minutes of day (or relative minutes)
 * @param {string} timeStr e.g. "16:45"
 * @returns {number} minutes from 00:00
 */
function parseTimeToMinutes(timeStr) {
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

/**
 * Adds minutes to an HH:mm formatted string
 * @param {string} timeStr e.g. "16:45"
 * @param {number} minutesToAdd e.g. 20
 * @returns {string} e.g. "17:05"
 */
function addMinutesToTimeString(timeStr, minutesToAdd) {
  if (!timeStr || !timeStr.includes(':')) {
    return timeStr || '12:00';
  }
  const totalMins = parseTimeToMinutes(timeStr) + minutesToAdd;
  const wrappedMins = ((totalMins % 1440) + 1440) % 1440;
  const hours = Math.floor(wrappedMins / 60);
  const mins = wrappedMins % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Evaluates shipment status strictly based on underlying data.
 * @param {string} eta - Estimated time of arrival (HH:mm)
 * @param {string} deadline - Promised delivery deadline (HH:mm)
 * @param {number} delayMinutes - Total accumulated delay in minutes
 * @returns {'ON_TRACK' | 'AT_RISK' | 'DELAYED'}
 */
function evaluateShipmentStatus(eta, deadline, delayMinutes = 0) {
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

module.exports = {
  parseTimeToMinutes,
  addMinutesToTimeString,
  evaluateShipmentStatus
};
