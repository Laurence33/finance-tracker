import { DDBConstants } from 'ft-common-layer';

export class RecurringExpensePayment {
    private userId: string;
    private recurringName: string;
    private periodKey: string;
    private amount: number;
    private fundSource: string;
    private expenseTimestamp: string;
    private paidAt: string;
    private notes: string;

    constructor(data: Record<string, any>, userId: string) {
        this.userId = userId;
        if (data.SK) {
            const parts = (data.SK as string).split('#');
            this.recurringName = parts[0];
            this.periodKey = parts.slice(1).join('#');
        } else {
            this.recurringName = data.recurringName;
            this.periodKey = data.periodKey;
        }

        this.amount = data.amount;
        this.fundSource = data.fundSource;
        this.expenseTimestamp = data.expenseTimestamp || '';
        this.paidAt = data.paidAt || new Date().toISOString();
        this.notes = data.notes || '';
    }

    toDdbItem() {
        return {
            PK: DDBConstants.PARTITIONS.RECURRING_EXPENSE_PAYMENT(this.userId),
            SK: `${this.recurringName}#${this.periodKey}`,
            amount: this.amount,
            fundSource: this.fundSource,
            expenseTimestamp: this.expenseTimestamp,
            paidAt: this.paidAt,
            notes: this.notes,
        };
    }

    toNormalItem() {
        return {
            recurringName: this.recurringName,
            periodKey: this.periodKey,
            amount: this.amount,
            fundSource: this.fundSource,
            expenseTimestamp: this.expenseTimestamp,
            paidAt: this.paidAt,
            notes: this.notes,
        };
    }
}
