import { DDBConstants } from 'ft-common-layer';
import { CreateLendingPaymentRequestBody } from 'types/Lending';

export class LendingPayment {
    private userId: string;
    private lendingTimestamp: string;
    private timestamp: string;
    private amount: number;
    private fundSource: string;
    private notes: string;

    constructor(data: CreateLendingPaymentRequestBody | Record<string, any>, userId: string) {
        this.userId = userId;
        if (data.SK) {
            const parts = (data.SK as string).split('#');
            this.lendingTimestamp = parts[0];
            this.timestamp = parts.slice(1).join('#');
        } else {
            this.lendingTimestamp = data.lendingTimestamp;
            this.timestamp = new Date().toISOString().replace('Z', '').replace('T', ' ');
        }

        this.amount = data.amount;
        this.fundSource = data.fundSource;
        this.notes = data.notes || '';
    }

    toDdbItem() {
        return {
            PK: DDBConstants.PARTITIONS.LENDING_PAYMENT(this.userId),
            SK: `${this.lendingTimestamp}#${this.timestamp}`,
            amount: this.amount,
            fundSource: this.fundSource,
            notes: this.notes,
        };
    }

    toNormalItem() {
        return {
            lendingTimestamp: this.lendingTimestamp,
            timestamp: this.timestamp,
            amount: this.amount,
            fundSource: this.fundSource,
            notes: this.notes,
        };
    }
}
