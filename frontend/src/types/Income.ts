export type Income = {
  amount: number;
  timestamp: string;
  fundSource: string;
  source: string;
  tags: string[];
  notes: string;
  allocations?: Record<string, number>;
};
