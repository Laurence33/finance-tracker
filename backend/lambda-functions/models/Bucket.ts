import { DDBConstants } from 'ft-common-layer';

export class Bucket {
    private userId: string;
    private key: string;
    private displayLabel: string;
    private percentage: number;
    private order: number;
    private balance: number;

    constructor(data: Record<string, any>, userId: string) {
        this.userId = userId;
        if (data.SK) this.key = data.SK; // from DynamoDB
        else this.key = data.key;

        this.displayLabel = data.displayLabel;
        this.percentage = data.percentage;
        this.order = data.order;
        this.balance = data.balance ?? 0;
    }

    toDdbItem() {
        return {
            PK: DDBConstants.PARTITIONS.BUCKET(this.userId),
            SK: this.key,
            displayLabel: this.displayLabel,
            percentage: this.percentage,
            order: this.order,
            balance: this.balance,
        };
    }

    toNormalItem() {
        return {
            key: this.key,
            displayLabel: this.displayLabel,
            percentage: this.percentage,
            order: this.order,
            balance: this.balance,
        };
    }
}
