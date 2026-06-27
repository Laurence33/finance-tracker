export type CreateIncomeRequestBody = {
    timestamp: string;
    amount: number;
    fundSource: string;
    source: string;
    tags: string[];
    notes: string;
    allocations?: Record<string, number>;
    SK?: string;
    LSI1SK?: string;
};
