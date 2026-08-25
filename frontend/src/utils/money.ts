/**
 * Shared money formatting. Every figure in the app is a peso amount or a peso
 * range, so the string shapes live here rather than in any one feature's
 * helpers file — see §3 "Numbers" in `docs/ui-patterns.md`.
 *
 * Prefer the `<Money>` component (`components/atoms/Money`) when rendering to
 * the DOM: it styles the currency glyph separately so it can be de-emphasised.
 * These functions are for the places that genuinely need a plain string —
 * chart tick/tooltip formatters, `helperText`, dialog prose.
 */

export const CURRENCY_GLYPH = '₱';

/** A fixed amount, or an inclusive min–max range. */
export type MoneyAmount = number | { min: number; max: number };

export function isMoneyRange(
  amount: MoneyAmount,
): amount is { min: number; max: number } {
  return typeof amount !== 'number';
}

/**
 * Money is written with either no decimals or exactly two — never one.
 * `toLocaleString()` alone drops a trailing zero, so a `4820.50` payment renders
 * as `4,820.5`, which reads as a truncated number rather than an amount. A whole
 * value stays whole; a fractional one gets both places.
 *
 * This only shapes a value that *arrives* fractional. Rounding a derived
 * aggregate is still the caller's job (§3) — `Money` never rounds for you.
 */
function formatNumber(value: number): string {
  const fractionDigits = Number.isInteger(value) ? 0 : 2;
  return value.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

/**
 * The digits only, with no currency glyph. Ranges collapse to a single en dash
 * with no spaces (`2,000–6,000`). Used where the glyph is rendered separately
 * so it can be styled down.
 */
export function formatMoneyValue(amount: MoneyAmount): string {
  if (!isMoneyRange(amount)) {
    return formatNumber(amount);
  }
  return `${formatNumber(amount.min)}–${formatNumber(amount.max)}`;
}

/**
 * Compact form: one glyph, en dash, no spaces (`₱2,000–6,000`). The default
 * for dense surfaces where width is contested.
 */
export function formatMoney(amount: MoneyAmount): string {
  return `${CURRENCY_GLYPH}${formatMoneyValue(amount)}`;
}

/**
 * Long form: both glyphs, spaced dash (`₱2,000 - ₱6,000`). Only for dialogs
 * and forms, where width is not contested and the repeated glyph aids reading
 * of a one-off value.
 */
export function formatMoneyLong(amount: MoneyAmount): string {
  if (!isMoneyRange(amount)) {
    return `${CURRENCY_GLYPH}${formatNumber(amount)}`;
  }
  return `${CURRENCY_GLYPH}${formatNumber(amount.min)} - ${CURRENCY_GLYPH}${formatNumber(amount.max)}`;
}

/**
 * A stored amount, put back into a money field. Nullish becomes an empty
 * field rather than the string `"undefined"`.
 */
export function toMoneyInput(value: number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}

/**
 * The inverse of the formatters: an amount as the user typed it, coerced for
 * the wire.
 *
 * Money fields hold the **raw input string**, not a number, because a
 * `type="number"` input reports its value mid-entry in ways that destroy a
 * half-typed decimal: a lone `.` comes back as `''` (so coercing to `0` turns
 * `.5` into `5`, a 10x error), and `45.50` round-tripped through `parseFloat`
 * renders back as `45.5`, eating the zero the user just typed. Parse once, at
 * submit — never per keystroke.
 *
 * Pair this with `step: 'any'` on the input: `step` defaults to `1`, which
 * makes the browser reject every fractional amount and block form submission.
 */
export function parseMoneyInput(raw: string | number): number {
  const value = typeof raw === 'number' ? raw : parseFloat(raw);
  return Number.isFinite(value) ? value : 0;
}
