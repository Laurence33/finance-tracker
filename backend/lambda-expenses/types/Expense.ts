/* eslint-disable prettier/prettier */
export type CreateExpenseRequestBody = {
  timestamp: string;
  amount: number;
  fundSource: string; // e.g., "cash", "credit", "debit"
};
