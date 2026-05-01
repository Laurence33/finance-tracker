import { DDBConstants } from 'ft-common-layer';
import { CreateIncomeRequestBody } from '../types/Income';

export class Income {
    private userId: string;
    private timestamp: string;
    private fundSource: string;
    private amount: number;
    private source: string;
    private tags: string[];
    private notes: string;

    constructor(data: CreateIncomeRequestBody | Record<string, any>, userId: string) {
        this.userId = userId;
        if (data.SK) this.timestamp = data.SK;
        else this.timestamp = data.timestamp.replace('T', ' ');

        if (data.LSI1SK) this.fundSource = data.LSI1SK;
        else this.fundSource = data.fundSource;

        this.amount = data.amount;
        this.source = data.source || '';
        this.tags = data.tags || [];
        this.notes = data.notes || '';
    }

    toDdbItem() {
        return {
            PK: DDBConstants.PARTITIONS.INCOME(this.userId),
            SK: this.timestamp,
            LSI1SK: this.fundSource,
            amount: this.amount,
            source: this.source,
            tags: this.tags,
            notes: this.notes,
        };
    }

    toNormalItem() {
        return {
            timestamp: this.timestamp,
            fundSource: this.fundSource,
            amount: this.amount,
            source: this.source,
            tags: this.tags,
            notes: this.notes,
        };
    }
}
