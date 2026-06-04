export function isValidDate(dateString: string) {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

// The app operates in Philippine Standard Time (UTC+8, no DST), matching the
// frontend's currentTimestampForInput(). Returns the current wall-clock time in
// that timezone as an ISO string without the trailing 'Z', e.g. "2026-06-04T20:00:00.000".
const APP_UTC_OFFSET_MS = 8 * 60 * 60 * 1000;

export function nowInAppTimezone() {
  return new Date(Date.now() + APP_UTC_OFFSET_MS).toISOString().replace('Z', '');
}