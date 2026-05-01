import { DDBConstants } from 'ft-common-layer';
import { CreateLendingRequestBody } from 'types/Lending';

export class Lending {
    private userId: string;
    private timestamp: string;
    private borrower: string;
    private amount: number;
    private totalPaid: number;
    private fundSource: string;
    private promisedDate: string;
    private status: 'active' | 'partially_paid' | 'paid';
    private notes: string;

    constructor(data: CreateLendingRequestBody | Record<string, any>, userId: string) {
        this.userId = userId;
        if (data.SK) {
            this.timestamp = data.SK;
            this.borrower = data.LSI1SK;
        } else {
            this.timestamp = new Date().toISOString().replace('Z', '').replace('T', ' ');
            this.borrower = data.borrower;
        }

        this.amount = data.amount;
        this.totalPaid = data.totalPaid ?? 0;
        this.fundSource = data.fundSource;
        this.promisedDate = data.promisedDate;
        this.status = data.status ?? 'active';
        this.notes = data.notes || '';
    }

    toDdbItem() {
        return {
            PK: DDBConstants.PARTITIONS.LENDING(this.userId),
            SK: this.timestamp,
            LSI1SK: this.borrower,
            amount: this.amount,
            totalPaid: this.totalPaid,
            fundSource: this.fundSource,
            promisedDate: this.promisedDate,
            status: this.status,
            notes: this.notes,
        };
    }

    toNormalItem() {
        return {
            timestamp: this.timestamp,
            borrower: this.borrower,
            amount: this.amount,
            totalPaid: this.totalPaid,
            fundSource: this.fundSource,
            promisedDate: this.promisedDate,
            status: this.status,
            notes: this.notes,
        };
    }
}
