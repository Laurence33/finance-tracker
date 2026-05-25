export type Lending = {
  borrower: string;
  amount: number;
  totalPaid: number;
  fundSource: string;
  promisedDate: string;
  status: 'active' | 'partially_paid' | 'paid';
  notes: string;
  timestamp: string;
  deductedFromBalance: boolean;
};

export type LendingPayment = {
  lendingTimestamp: string;
  amount: number;
  fundSource: string;
  timestamp: string;
  notes: string;
  addedToBalance: boolean;
};
