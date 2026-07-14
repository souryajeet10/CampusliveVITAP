/**
 * Formats a timestamp or date to relative time (e.g. "5 minutes ago", "2 hours ago").
 * @param {Date|number} date - Date object or millisecond timestamp
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

/**
 * Calculates remaining time before a 48h expiration timestamp.
 * @param {number} expiresAtMs - The expiration epoch timestamp
 * @returns {string} Remaining time description (e.g. "45h 12m left")
 */
export const getRemainingTime = (expiresAtMs) => {
  const now = Date.now();
  const diffMs = expiresAtMs - now;

  if (diffMs <= 0) return 'Expired';

  const totalMins = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m left`;
  }
  return `${mins}m left`;
};
