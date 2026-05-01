import { DDBConstants } from 'ft-common-layer';

export class FundSource {
    private userId: string;
    private name: string;
    private balance: string;
    private displayText: string;
    private icon: string;

    constructor(data: Record<string, any>, userId: string) {
        this.userId = userId;
        if (data.SK) this.name = data.SK; // from DynamoDB
        else this.name = data.name;

        this.balance = data.balance;
        this.displayText = data.displayText;
        this.icon = data.icon || 'wallet';
    }

    toDdbItem() {
        return {
            PK: DDBConstants.PARTITIONS.FUND_SOURCE(this.userId),
            SK: this.name,
            balance: this.balance,
            displayText: this.displayText,
            icon: this.icon,
        };
    }

    toNormalItem() {
        return {
            name: this.name,
            balance: this.balance,
            displayText: this.displayText,
            icon: this.icon,
        };
    }
}
