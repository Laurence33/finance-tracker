/* eslint-disable prettier/prettier */
import { CreateExpenseRequestBody } from '../types/Expense';

export const EXPENSE_PK = 'Expense#Expense';
export class Expense {
  private PK = EXPENSE_PK;
  private timestamp: string;
  private fundSource: string;
  private amount: number;

  constructor(body: CreateExpenseRequestBody | Record<string, any>, fromDdb = false) {
    if (!fromDdb) {
      this.timestamp = body.timestamp.replace('T', ' ');
      this.fundSource = body.fundSource;
      this.amount = body.amount;
    }
    else {
      this.timestamp = body.SK;
      this.fundSource = body.fundSource;
      this.amount = body.amount;
    }
  }

  toDdbItem() {
    return {
      PK: this.PK,
      SK: this.timestamp,
      fundSource: this.fundSource,
      amount: this.amount,
    };
  }

  toNormalItem() {
    return {
      timestamp: this.timestamp,
      fundSource: this.fundSource,
      amount: this.amount,
    };
  }
}
