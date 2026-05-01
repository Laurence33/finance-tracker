import { PutCommand, QueryCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { DDBConstants } from 'ft-common-layer';
import { ddbDocClient } from './ddb-client';
import { Lending } from 'models/Lending';
import { LendingPayment } from 'models/LendingPayment';

const SINGLE_TABLE_NAME = DDBConstants.DDB_TABLE_NAME;

export class LendingsService {
    constructor(private userId: string) {}

    private get lendingPk() { return DDBConstants.PARTITIONS.LENDING(this.userId); }
    private get lendingPaymentPk() { return DDBConstants.PARTITIONS.LENDING_PAYMENT(this.userId); }
    private get fundSourcePk() { return DDBConstants.PARTITIONS.FUND_SOURCE(this.userId); }

    async getAll() {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': this.lendingPk,
            },
            ScanIndexForward: false,
        });
        const response = await ddbDocClient.send(command);
        const lendings = response.Items?.map((item) => new Lending(item, this.userId).toNormalItem());
        return lendings || [];
    }

    async getLending(timestamp: string) {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND SK = :sk',
            ExpressionAttributeValues: {
                ':pk': this.lendingPk,
                ':sk': timestamp,
            },
        });
        const response = await ddbDocClient.send(command);
        if (response.Items && response.Items.length > 0) {
            return new Lending(response.Items[0], this.userId);
        }
        return null;
    }

    async getDistinctBorrowers(): Promise<string[]> {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': this.lendingPk,
            },
            ProjectionExpression: 'LSI1SK',
        });
        const response = await ddbDocClient.send(command);
        const borrowers = response.Items?.map((item) => item.LSI1SK as string) || [];
        return [...new Set(borrowers)];
    }

    async create(data: any) {
        const lending = new Lending(data, this.userId);
        const ddbItem = lending.toDdbItem();

        const transactCmd = new TransactWriteCommand({
            TransactItems: [
                {
                    Put: {
                        TableName: SINGLE_TABLE_NAME,
                        Item: ddbItem,
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
                        ConditionExpression: 'attribute_exists(PK) AND balance >= :amt',
                        ExpressionAttributeValues: {
                            ':amt': data.amount,
                        },
                    },
                },
            ],
        });

        await ddbDocClient.send(transactCmd);
        return lending.toNormalItem();
    }

    async addPayment(lendingTimestamp: string, data: any) {
        const lending = await this.getLending(lendingTimestamp);
        if (!lending) {
            throw new Error('Lending not found.');
        }

        const lendingItem = lending.toNormalItem();
        const newTotalPaid = lendingItem.totalPaid + data.amount;
        const newStatus = newTotalPaid >= lendingItem.amount ? 'paid' : 'partially_paid';

        const payment = new LendingPayment(
            {
                ...data,
                lendingTimestamp,
            },
            this.userId,
        );

        const transactCmd = new TransactWriteCommand({
            TransactItems: [
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
                            PK: this.lendingPk,
                            SK: lendingTimestamp,
                        },
                        UpdateExpression: 'SET totalPaid = :tp, #st = :st',
                        ExpressionAttributeNames: {
                            '#st': 'status',
                        },
                        ExpressionAttributeValues: {
                            ':tp': newTotalPaid,
                            ':st': newStatus,
                        },
                    },
                },
                {
                    Update: {
                        TableName: SINGLE_TABLE_NAME,
                        Key: {
                            PK: this.fundSourcePk,
                            SK: data.fundSource,
                        },
                        UpdateExpression: 'SET balance = balance + :amt',
                        ConditionExpression: 'attribute_exists(PK)',
                        ExpressionAttributeValues: {
                            ':amt': data.amount,
                        },
                    },
                },
            ],
        });

        await ddbDocClient.send(transactCmd);
        return payment.toNormalItem();
    }

    async getPayments(lendingTimestamp: string) {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues: {
                ':pk': this.lendingPaymentPk,
                ':sk': `${lendingTimestamp}#`,
            },
            ScanIndexForward: false,
        });
        const response = await ddbDocClient.send(command);
        const payments = response.Items?.map((item) => new LendingPayment(item, this.userId).toNormalItem());
        return payments || [];
    }

    async hasPayments(lendingTimestamp: string): Promise<boolean> {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues: {
                ':pk': this.lendingPaymentPk,
                ':sk': `${lendingTimestamp}#`,
            },
            Limit: 1,
        });
        const response = await ddbDocClient.send(command);
        return (response.Items?.length ?? 0) > 0;
    }

    async delete(timestamp: string) {
        const lending = await this.getLending(timestamp);
        if (!lending) {
            throw new Error('Lending not found.');
        }

        const lendingItem = lending.toNormalItem();
        const remainingAmount = lendingItem.amount - lendingItem.totalPaid;

        const transactCmd = new TransactWriteCommand({
            TransactItems: [
                {
                    Delete: {
                        TableName: SINGLE_TABLE_NAME,
                        Key: {
                            PK: this.lendingPk,
                            SK: timestamp,
                        },
                    },
                },
                {
                    Update: {
                        TableName: SINGLE_TABLE_NAME,
                        Key: {
                            PK: this.fundSourcePk,
                            SK: lendingItem.fundSource,
                        },
                        UpdateExpression: 'SET balance = balance + :amt',
                        ExpressionAttributeValues: {
                            ':amt': remainingAmount,
                        },
                    },
                },
            ],
        });

        await ddbDocClient.send(transactCmd);
    }

    async update(timestamp: string, body: any) {
        const lending = await this.getLending(timestamp);
        if (!lending) {
            throw new Error('Lending not found.');
        }

        const existingItem = lending.toNormalItem();
        const updatedData = { ...existingItem, ...body };

        const updatedLending = new Lending(
            {
                ...updatedData,
                SK: existingItem.timestamp,
                LSI1SK: updatedData.borrower,
            },
            this.userId,
        );

        const putCmd = new PutCommand({
            TableName: SINGLE_TABLE_NAME,
            Item: updatedLending.toDdbItem(),
        });
        await ddbDocClient.send(putCmd);

        return updatedLending.toNormalItem();
    }
}
