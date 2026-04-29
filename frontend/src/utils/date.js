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
 * Return tomorrow's date string in local timezone.
 */
export function localTomorrowString(d = new Date()) {
  const tomorrow = new Date(d);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return localDateString(tomorrow);
}
