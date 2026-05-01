import { DDBConstants } from 'ft-common-layer';
import { CreateRecurringExpenseRequestBody } from 'types/RecurringExpense';

export class RecurringExpense {
    private userId: string;
    private name: string;
    private displayName: string;
    private amountType: 'fixed' | 'range';
    private amount: number;
    private amountMin: number;
    private amountMax: number;
    private frequency: 'weekly' | 'monthly' | 'yearly' | 'as_needed';
    private startDate: string;
    private endDate: string;
    private status: 'active' | 'completed' | 'cancelled';
    private tags: string[];
    private notes: string;

    constructor(data: CreateRecurringExpenseRequestBody | Record<string, any>, userId: string) {
        this.userId = userId;
        if (data.SK) this.name = data.SK;
        else this.name = data.name;

        this.displayName = data.displayName;
        this.amountType = data.amountType || 'fixed';
        this.amount = data.amount || 0;
        this.amountMin = data.amountMin || 0;
        this.amountMax = data.amountMax || 0;
        this.frequency = data.frequency;
        this.startDate = data.startDate || '';
        this.endDate = data.endDate || '';
        this.status = data.status || 'active';
        this.tags = data.tags || [];
        this.notes = data.notes || '';
    }

    toDdbItem() {
        return {
            PK: DDBConstants.PARTITIONS.RECURRING_EXPENSE(this.userId),
            SK: this.name,
            displayName: this.displayName,
            amountType: this.amountType,
            amount: this.amount,
            amountMin: this.amountMin,
            amountMax: this.amountMax,
            frequency: this.frequency,
            startDate: this.startDate,
            endDate: this.endDate,
            status: this.status,
            tags: this.tags,
            notes: this.notes,
        };
    }

    toNormalItem() {
        return {
            name: this.name,
            displayName: this.displayName,
            amountType: this.amountType,
            amount: this.amount,
            amountMin: this.amountMin,
            amountMax: this.amountMax,
            frequency: this.frequency,
            startDate: this.startDate,
            endDate: this.endDate,
            status: this.status,
            tags: this.tags,
            notes: this.notes,
        };
    }
}
