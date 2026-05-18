import { Expense } from '@/types/Expense';

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
