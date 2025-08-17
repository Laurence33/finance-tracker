/* eslint-disable prettier/prettier */
import { CreateExpenseRequestBody } from '../types/Expense';

export class Expense {
  private PK = 'Expense#Expense';
  private timestamp: string;
  private fundSource: string;
  private amount: number;

  constructor(body: CreateExpenseRequestBody) {
    this.timestamp = body.timestamp.replace('T', ' ');
    this.fundSource = body.fundSource;
    this.amount = body.amount;
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
