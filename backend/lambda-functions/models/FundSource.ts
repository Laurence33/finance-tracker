import { DDBConstants } from 'ft-common-layer';

export class FundSource {
    private PK = DDBConstants.PARTITIONS.FUND_SOURCE;
    private name: string;
    private balance: string;
    private displayText: string;

    constructor(data: Record<string, any>) {
        if (data.SK) this.name = data.SK; // from DynamoDB
        else this.name = data.name;

        this.balance = data.balance;
        this.displayText = data.displayText;
    }

    toDdbItem() {
        return {
            PK: this.PK,
            SK: this.name,
            balance: this.balance,
            displayText: this.displayText,
        };
    }

    toNormalItem() {
        return {
            name: this.name,
            balance: this.balance,
            displayText: this.displayText,
        };
    }
}
