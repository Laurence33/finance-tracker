import { describe, it, expect } from 'vitest';
import { canDebitFundSource } from './fund-source-debit';

describe('canDebitFundSource', () => {
  it('always allows a credit card at zero balance', () => {
    expect(canDebitFundSource({ isCreditCard: true, balance: 0 }, 500)).toBe(true);
  });

  it('always allows a credit card at negative balance', () => {
    expect(canDebitFundSource({ isCreditCard: true, balance: -1200 }, 500)).toBe(true);
  });

  it('always allows a credit card at positive balance, even above it', () => {
    expect(canDebitFundSource({ isCreditCard: true, balance: 100 }, 500)).toBe(true);
  });

  it('allows cash at exactly its balance', () => {
    expect(canDebitFundSource({ isCreditCard: false, balance: 500 }, 500)).toBe(true);
  });

  it('refuses cash above its balance', () => {
    expect(canDebitFundSource({ isCreditCard: false, balance: 500 }, 500.01)).toBe(false);
  });
});
