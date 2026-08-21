/**
 * Utility for parsing and formatting UTC timestamps from backend into localized user dates & times.
 */

export function parseUtcDate(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput !== 'string') return new Date(dateInput);

  let str = dateInput.trim();
  // If the ISO string does not have a timezone indicator (no 'Z' and no +HH:MM or -HH:MM at the end)
  // we assume it is UTC and append 'Z' so browsers parse it as UTC rather than local time.
  if (!str.endsWith('Z') && !/\+\d{2}:\d{2}$/.test(str) && !/-\d{2}:\d{2}$/.test(str)) {
    // Replace space with 'T' if format is 'YYYY-MM-DD HH:mm:ss'
    str = str.replace(' ', 'T') + 'Z';
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDateTime(dateInput) {
  const d = parseUtcDate(dateInput);
  if (!d) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

export function formatDate(dateInput) {
  const d = parseUtcDate(dateInput);
  if (!d) return '—';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatTime(dateInput) {
  const d = parseUtcDate(dateInput);
  if (!d) return '—';
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

export function formatRelativeTime(dateInput) {
  const d = parseUtcDate(dateInput);
  if (!d) return 'Never';
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSec < 5) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}
