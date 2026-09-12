/**
 * Format a Date as "YYYY-MM-DD" in the user's local timezone.
 * This avoids the UTC-shift bug that toISOString().split('T')[0] causes
 * near midnight in non-UTC timezones.
 */
export function localDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a stored record date as "YYYY-MM-DD".
 * Record dates are persisted at UTC midnight as calendar-day markers, so read
 * them back with UTC components — using local getters shifts the day for users
 * behind UTC and misaligns completions from the day they belong to.
 */
export function utcDateString(d) {
  const date = new Date(d);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Return tomorrow's date string in local timezone.
 */
export function localTomorrowString(d = new Date()) {
  const tomorrow = new Date(d);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return localDateString(tomorrow);
}
