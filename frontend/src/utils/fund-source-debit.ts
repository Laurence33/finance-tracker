import type { FundSource } from '@/types/FundSource';

/**
 * The debit rule, mirroring the backend's `canDebitFundSource`: a credit card
 * may always be debited (its balance may go negative); any other fund source
 * only up to what it holds.
 */
export function canDebitFundSource(
  fundSource: Pick<FundSource, 'isCreditCard' | 'balance'>,
  amount: number,
): boolean {
  if (fundSource.isCreditCard) return true;
  return fundSource.balance >= amount;
}
