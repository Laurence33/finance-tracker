import { Expense } from '@/types/Expense';
import { Bucket } from '@/types/Budget';

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Splits `amount` across buckets by their percentages, rounded to cents. Any
 * rounding remainder is added to the first bucket (by order) so the parts always
 * sum exactly to `amount` — this mirrors the backend's tolerance check.
 */
export function computeAllocations(
  amount: number,
  buckets: Bucket[]
): Record<string, number> {
  const result: Record<string, number> = {};
  if (!buckets.length) return result;

  const ordered = [...buckets].sort((a, b) => a.order - b.order);
  const safeAmount = isNaN(amount) || amount < 0 ? 0 : amount;

  let allocated = 0;
  for (const bucket of ordered) {
    const value = round2((safeAmount * bucket.percentage) / 100);
    result[bucket.key] = value;
    allocated += value;
  }

  // Push the rounding remainder into the first (highest-priority) bucket.
  const remainder = round2(safeAmount - allocated);
  if (remainder !== 0) {
    const first = ordered[0].key;
    result[first] = round2(result[first] + remainder);
  }

  return result;
}

export function sumAllocations(allocations: Record<string, number>): number {
  return round2(
    Object.values(allocations).reduce((sum, v) => sum + (Number(v) || 0), 0)
  );
}

/** True when the allocation values sum to `amount` within half a cent. */
export function allocationsMatchAmount(
  allocations: Record<string, number>,
  amount: number
): boolean {
  return Math.abs(sumAllocations(allocations) - amount) <= 0.005;
}

export type BudgetStatus = {
  spent: number;
  budget: number;
  percentUsed: number;
  isOver: boolean;
};

export function getSpentByTag(expenses: Expense[]): Map<string, number> {
  const spent = new Map<string, number>();
  for (const expense of expenses) {
    for (const tag of expense.tags || []) {
      spent.set(tag, (spent.get(tag) || 0) + expense.amount);
    }
  }
  return spent;
}

export function computeBudgetStatus(spent: number, budget: number): BudgetStatus {
  const safeBudget = budget > 0 ? budget : 0;
  const percentUsed = safeBudget > 0 ? (spent / safeBudget) * 100 : 0;
  return {
    spent,
    budget: safeBudget,
    percentUsed,
    isOver: safeBudget > 0 && spent > safeBudget,
  };
}
