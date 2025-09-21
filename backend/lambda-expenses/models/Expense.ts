import { CreateExpenseRequestBody } from '../types/Expense';
export const EXPENSE_PK = 'Expense#Expense';
export class Expense {
    private PK = EXPENSE_PK;
    private timestamp: string;
    private fundSource: string;
    private amount: number;

    constructor(data: CreateExpenseRequestBody | Record<string, any>) {
        if (data.SK) this.timestamp = data.SK; // from DynamoDB
        else this.timestamp = data.timestamp.replace('T', ' ');
        this.fundSource = data.fundSource;
        this.amount = data.amount;
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
