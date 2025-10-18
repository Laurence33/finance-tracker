export type CreateExpenseRequestBody = {
    timestamp: string;
    amount: number;
    fundSource: string; // e.g., "cash", "credit", "debit"
    SK?: string;
    LSI1SK?: string;
};
