/**
 * Display helpers for the transactions ledger (expenses + income).
 *
 * The backend stores timestamps as `'YYYY-MM-DD HH:mm:ss.SSS'` with no zone,
 * so the date and time parts are read by slicing rather than by parsing to a
 * `Date`: parsing would re-interpret that wall-clock reading in whichever zone
 * the runtime happens to be in, which can shift a record onto the neighbouring
 * day — and shift it differently on the server than in the browser. The slices
 * also tolerate the `'T'` separator that `currentTimestampForInput` produces.
 */
import { TZDate } from '@date-fns/tz';
import { format, subDays } from 'date-fns';

/** The zone every stored timestamp is written in. See `date-functions.ts`. */
const APP_TIME_ZONE = 'asia/singapore';

/**
 * "Now" as the rest of the app reckons it. Fixed-zone on purpose — a
 * `new Date()` here would make "Today" depend on the viewer's own zone.
 */
function nowInAppZone(): Date {
  return TZDate.tz(APP_TIME_ZONE) as unknown as Date;
}

/** `'2026-07-26'` — the grouping key, and stable to sort as a string. */
export function transactionDateKey(timestamp: string): string {
  return timestamp.slice(0, 10);
}

/** `'14:30'`, or `''` for a date-only timestamp. */
export function transactionTime(timestamp: string): string {
  return timestamp.slice(11, 16);
}

/**
 * The section header for a day's group: `Today` / `Yesterday` where they apply,
 * otherwise a plain date — with the year only when it is not the current one,
 * since the month selector keeps the list inside a single month.
 */
export function transactionDateHeading(
  dateKey: string,
  now: Date = nowInAppZone(),
): string {
  if (dateKey === format(now, 'yyyy-MM-dd')) return 'Today';
  if (dateKey === format(subDays(now, 1), 'yyyy-MM-dd')) return 'Yesterday';

  // Midnight-local, so the weekday is the one this date names in any zone.
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateKey;

  return date.getFullYear() === now.getFullYear()
    ? format(date, 'EEE, d MMM')
    : format(date, 'd MMM yyyy');
}
