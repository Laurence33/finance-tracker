import { DDBConstants } from 'ft-common-layer';
import { CreateExpenseRequestBody } from '../types/Expense';
export class Expense {
    private userId: string;
    private timestamp: string;
    private fundSource: string;
    private amount: number;
    private tags: string[];
    private notes: string;

    constructor(data: CreateExpenseRequestBody | Record<string, any>, userId: string) {
        this.userId = userId;
        if (data.SK) this.timestamp = data.SK; // from DynamoDB
        else this.timestamp = data.timestamp.replace('T', ' ');

        if (data.LSI1SK) this.fundSource = data.LSI1SK; // from DynamoDB
        else this.fundSource = data.fundSource;

        this.amount = data.amount;
        this.tags = data.tags || [];
        this.notes = data.notes || '';
    }

    toDdbItem() {
        return {
            PK: DDBConstants.PARTITIONS.EXPENSE(this.userId),
            SK: this.timestamp,
            LSI1SK: this.fundSource,
            amount: this.amount,
            tags: this.tags,
            notes: this.notes,
        };
    }

    toNormalItem() {
        return {
            timestamp: this.timestamp,
            fundSource: this.fundSource,
            amount: this.amount,
            tags: this.tags,
            notes: this.notes,
        };
    }
}
