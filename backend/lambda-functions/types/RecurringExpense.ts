export type CreateRecurringExpenseRequestBody = {
    name: string;
    displayName: string;
    amountType: 'fixed' | 'range';
    amount: number;
    amountMin: number;
    amountMax: number;
    frequency: 'weekly' | 'monthly' | 'yearly' | 'as_needed';
    startDate: string;
    endDate: string;
    status?: 'active' | 'completed' | 'cancelled';
    tags: string[];
    notes: string;
    SK?: string;
};

export type PayRecurringExpenseRequestBody = {
    periodKey: string;
    amount: number;
    fundSource: string;
    notes: string;
};
