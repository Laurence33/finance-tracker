import { describe, it, expect } from 'vitest';
import { parseMoneyInput, toMoneyInput } from './money';

describe('parseMoneyInput', () => {
  it('keeps the fraction of a fully typed amount', () => {
    expect(parseMoneyInput('45.50')).toBe(45.5);
    expect(parseMoneyInput('0.01')).toBe(0.01);
  });

  it('reads a leading-decimal amount as a fraction, not a whole number', () => {
    // The bug this guards: coercing `.5` per keystroke used to yield 5.
    expect(parseMoneyInput('.5')).toBe(0.5);
  });

  it('treats a half-typed or empty amount as zero', () => {
    // A `type="number"` input reports '' for a lone '.' mid-entry.
    expect(parseMoneyInput('')).toBe(0);
    expect(parseMoneyInput('abc')).toBe(0);
  });

  it('accepts a number unchanged', () => {
    expect(parseMoneyInput(45.5)).toBe(45.5);
    expect(parseMoneyInput(0)).toBe(0);
  });

  it('never returns a non-finite value', () => {
    expect(parseMoneyInput(NaN)).toBe(0);
    expect(parseMoneyInput(Infinity)).toBe(0);
  });

  it('round-trips a stored amount', () => {
    expect(parseMoneyInput(toMoneyInput(1234.56))).toBe(1234.56);
  });
});

describe('toMoneyInput', () => {
  it('renders a stored amount as the raw field text', () => {
    expect(toMoneyInput(1234.5)).toBe('1234.5');
    expect(toMoneyInput(0)).toBe('0');
  });

  it('leaves the field empty for a missing amount', () => {
    expect(toMoneyInput(undefined)).toBe('');
    expect(toMoneyInput(null)).toBe('');
  });
});
