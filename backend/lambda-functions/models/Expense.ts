import { DDBConstants } from 'ft-common-layer';
import { CreateExpenseRequestBody } from '../types/Expense';
export class Expense {
    private PK = DDBConstants.PARTITIONS.EXPENSE;
    private timestamp: string;
    private fundSource: string;
    private amount: number;

    constructor(data: CreateExpenseRequestBody | Record<string, any>) {
        if (data.SK) this.timestamp = data.SK; // from DynamoDB
        else this.timestamp = data.timestamp.replace('T', ' ');

        if (data.LSI1SK) this.fundSource = data.LSI1SK; // from DynamoDB
        else this.fundSource = data.fundSource;

        this.amount = data.amount;
    }

    toDdbItem() {
        return {
            PK: this.PK,
            SK: this.timestamp,
            LSI1SK: this.fundSource,
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
