import { DDBConstants } from 'ft-common-layer';
import { CreateExpenseRequestBody } from '../types/Expense';
export class FundSource {
    private PK = DDBConstants.PARTITIONS.FUND_SOURCE;
    private name: string;
    private balance: string;

    constructor(data: Record<string, any>) {
        this.name = data.SK; // from DynamoDB
        this.balance = data.balance;
    }

    toDdbItem() {
        return {
            PK: this.PK,
            SK: this.name,
            balance: this.balance,
        };
    }

    toNormalItem() {
        return {
            name: this.name,
            balance: this.balance,
        };
    }
}
