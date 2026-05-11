import { DDBConstants } from 'ft-common-layer';
import { CreateTransferRequestBody } from '../types/Transfer';

export class Transfer {
    private userId: string;
    private timestamp: string;
    private sourceFundSource: string;
    private destinationFundSource: string;
    private amount: number;
    private fee: number;
    private note: string;

    constructor(data: CreateTransferRequestBody | Record<string, any>, userId: string) {
        this.userId = userId;
        if (data.SK) this.timestamp = data.SK;
        else this.timestamp = data.timestamp.replace('T', ' ');

        if (data.LSI1SK) this.sourceFundSource = data.LSI1SK;
        else this.sourceFundSource = data.sourceFundSource;

        this.destinationFundSource = data.destinationFundSource;
        this.amount = data.amount;
        this.fee = data.fee ?? 0;
        this.note = data.note || '';
    }

    toDdbItem() {
        return {
            PK: DDBConstants.PARTITIONS.TRANSFER(this.userId),
            SK: this.timestamp,
            LSI1SK: this.sourceFundSource,
            destinationFundSource: this.destinationFundSource,
            amount: this.amount,
            fee: this.fee,
            note: this.note,
        };
    }

    toNormalItem() {
        return {
            timestamp: this.timestamp,
            sourceFundSource: this.sourceFundSource,
            destinationFundSource: this.destinationFundSource,
            amount: this.amount,
            fee: this.fee,
            note: this.note,
        };
    }
}
