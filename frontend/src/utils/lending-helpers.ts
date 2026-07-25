/**
 * Lending domain helpers. `isLendingOverdue` had been copied into four files
 * before this module existed; it lives here so the list, the row, the page and
 * the detail dialog cannot drift apart on what "overdue" means.
 */

import { Lending } from '@/types/Lending';

/**
 * Which ledger group a lending belongs to. `overdue` is not a stored status —
 * it is derived from the promised date, and it outranks the stored status
 * because an overdue lending is the actionable one whether or not part of it
 * has already been repaid.
 */
export type LendingGroup = 'overdue' | 'active' | 'partially_paid' | 'paid';

/**
 * Past its promised date and not yet settled. Compared date-only, so a lending
 * promised for today is not overdue until tomorrow.
 */
export function isLendingOverdue(lending: Lending): boolean {
  if (lending.status === 'paid') return false;
  return new Date(lending.promisedDate) < new Date(new Date().toDateString());
}

export function getLendingGroup(lending: Lending): LendingGroup {
  return isLendingOverdue(lending) ? 'overdue' : lending.status;
}

/**
 * Fixed domain order for the group headers — most actionable first, never
 * alphabetical (§2 of `docs/ui-patterns.md`). This replaces the old row-level
 * overdue-priority sort: the ordering is now visible in the headers instead of
 * being an unexplained shuffle of a flat list.
 */
export const LENDING_GROUPS: { group: LendingGroup; heading: string }[] = [
  { group: 'overdue', heading: 'Overdue' },
  { group: 'active', heading: 'Active' },
  { group: 'partially_paid', heading: 'Partially Paid' },
  { group: 'paid', heading: 'Paid' },
];

/** What is still owed on a lending. */
export function getLendingRemaining(lending: Lending): number {
  return lending.amount - lending.totalPaid;
}
