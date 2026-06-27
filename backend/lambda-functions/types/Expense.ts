export type CreateExpenseRequestBody = {
    timestamp: string;
    amount: number;
    fundSource: string; // e.g., "cash", "credit", "debit"
    tags: string[];
    notes: string;
    bucket?: string;
    SK?: string;
    LSI1SK?: string;
};
