export type CreateLendingRequestBody = {
    borrower: string;
    amount: number;
    fundSource: string;
    promisedDate: string;
    notes: string;
    deductedFromBalance?: boolean;
    SK?: string;
    LSI1SK?: string;
    totalPaid?: number;
    status?: 'active' | 'partially_paid' | 'paid';
};

export type CreateLendingPaymentRequestBody = {
    lendingTimestamp: string;
    amount: number;
    fundSource: string;
    notes: string;
    addedToBalance?: boolean;
    SK?: string;
};
