import { DeleteCommand, PutCommand, QueryCommand, TransactWriteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DDBConstants, nowInAppTimezone } from 'ft-common-layer';
import { ddbDocClient } from './ddb-client';
import { RecurringExpense } from 'models/RecurringExpense';
import { RecurringExpensePayment } from 'models/RecurringExpensePayment';
import { Expense } from 'models/Expense';

const SINGLE_TABLE_NAME = DDBConstants.DDB_TABLE_NAME;

export class RecurringExpensesService {
    constructor(private userId: string) {}

    private get recurringPk() { return DDBConstants.PARTITIONS.RECURRING_EXPENSE(this.userId); }
    private get recurringPaymentPk() { return DDBConstants.PARTITIONS.RECURRING_EXPENSE_PAYMENT(this.userId); }
    private get fundSourcePk() { return DDBConstants.PARTITIONS.FUND_SOURCE(this.userId); }

    async getAll() {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': this.recurringPk,
            },
        });
        const response = await ddbDocClient.send(command);
        const items = response.Items?.map((item) => new RecurringExpense(item, this.userId).toNormalItem());
        return items || [];
    }

    async getRecurringExpense(name: string) {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND SK = :sk',
            ExpressionAttributeValues: {
                ':pk': this.recurringPk,
                ':sk': name,
            },
        });
        const response = await ddbDocClient.send(command);
        if (response.Items && response.Items.length > 0) {
            return new RecurringExpense(response.Items[0], this.userId);
        }
        return null;
    }

    async create(data: any) {
        const recurring = new RecurringExpense(data, this.userId);
        const command = new PutCommand({
            TableName: SINGLE_TABLE_NAME,
            Item: recurring.toDdbItem(),
        });
        await ddbDocClient.send(command);
        return recurring.toNormalItem();
    }

    async update(name: string, body: any) {
        const existing = await this.getRecurringExpense(name);
        if (!existing) {
            throw new Error('Recurring expense not found.');
        }

        const existingItem = existing.toNormalItem();
        const updatedData = { ...existingItem, ...body };
        const updated = new RecurringExpense(updatedData, this.userId);

        const putCmd = new PutCommand({
            TableName: SINGLE_TABLE_NAME,
            Item: updated.toDdbItem(),
        });
        await ddbDocClient.send(putCmd);
        return updated.toNormalItem();
    }

    async delete(name: string) {
        const deleteCmd = new DeleteCommand({
            TableName: SINGLE_TABLE_NAME,
            Key: {
                PK: this.recurringPk,
                SK: name,
            },
        });
        await ddbDocClient.send(deleteCmd);
    }

    async getPayments(recurringName: string) {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues: {
                ':pk': this.recurringPaymentPk,
                ':sk': `${recurringName}#`,
            },
            ScanIndexForward: false,
        });
        const response = await ddbDocClient.send(command);
        const payments = response.Items?.map((item) => new RecurringExpensePayment(item, this.userId).toNormalItem());
        return payments || [];
    }

    async getAllPayments() {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': this.recurringPaymentPk,
            },
        });
        const response = await ddbDocClient.send(command);
        const payments = response.Items?.map((item) => new RecurringExpensePayment(item, this.userId).toNormalItem());
        return payments || [];
    }

    async getPayment(recurringName: string, periodKey: string) {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND SK = :sk',
            ExpressionAttributeValues: {
                ':pk': this.recurringPaymentPk,
                ':sk': `${recurringName}#${periodKey}`,
            },
        });
        const response = await ddbDocClient.send(command);
        if (response.Items && response.Items.length > 0) {
            return new RecurringExpensePayment(response.Items[0], this.userId);
        }
        return null;
    }

    async hasPayments(recurringName: string): Promise<boolean> {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues: {
                ':pk': this.recurringPaymentPk,
                ':sk': `${recurringName}#`,
            },
            Limit: 1,
        });
        const response = await ddbDocClient.send(command);
        return (response.Items?.length ?? 0) > 0;
    }

    async pay(recurringName: string, data: any, recurringExpense: any) {
        const expenseTimestamp = nowInAppTimezone().replace('T', ' ');

        const expense = new Expense(
            {
                timestamp: expenseTimestamp,
                amount: data.amount,
                fundSource: data.fundSource,
                tags: recurringExpense.tags,
                notes: `${recurringExpense.displayName} - ${data.periodKey}${data.notes ? ' - ' + data.notes : ''}`,
            },
            this.userId,
        );

        const payment = new RecurringExpensePayment(
            {
                recurringName,
                periodKey: data.periodKey,
                amount: data.amount,
                fundSource: data.fundSource,
                expenseTimestamp,
                paidAt: new Date().toISOString(),
                notes: data.notes || '',
            },
            this.userId,
        );

        const transactCmd = new TransactWriteCommand({
            TransactItems: [
                {
                    Put: {
                        TableName: SINGLE_TABLE_NAME,
                        Item: expense.toDdbItem(),
                    },
                },
                {
                    Put: {
                        TableName: SINGLE_TABLE_NAME,
                        Item: payment.toDdbItem(),
                    },
                },
                {
                    Update: {
                        TableName: SINGLE_TABLE_NAME,
                        Key: {
                            PK: this.fundSourcePk,
                            SK: data.fundSource,
                        },
                        UpdateExpression: 'SET balance = balance - :amt',
                        ConditionExpression: 'attribute_exists(PK) AND (isCreditCard = :true OR balance >= :amt)',
                        ExpressionAttributeValues: {
                            ':amt': data.amount,
                            ':true': true,
                        },
                    },
                },
            ],
        });

        await ddbDocClient.send(transactCmd);
        return payment.toNormalItem();
    }

    async updateStatus(name: string, status: 'active' | 'completed' | 'cancelled') {
        const updateCmd = new UpdateCommand({
            TableName: SINGLE_TABLE_NAME,
            Key: {
                PK: this.recurringPk,
                SK: name,
            },
            UpdateExpression: 'SET #st = :st',
            ConditionExpression: 'attribute_exists(PK)',
            ExpressionAttributeNames: {
                '#st': 'status',
            },
            ExpressionAttributeValues: {
                ':st': status,
            },
        });
        await ddbDocClient.send(updateCmd);
    }
}
