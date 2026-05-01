export type RecurringExpense = {
  name: string;
  displayName: string;
  amountType: 'fixed' | 'range';
  amount: number;
  amountMin: number;
  amountMax: number;
  frequency: 'weekly' | 'monthly' | 'yearly' | 'as_needed';
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'cancelled';
  tags: string[];
  notes: string;
};

export type RecurringExpensePayment = {
  recurringName: string;
  periodKey: string;
  amount: number;
  fundSource: string;
  expenseTimestamp: string;
  paidAt: string;
  notes: string;
};
