import { QueryCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { DDBConstants } from 'ft-common-layer';
import { Income } from '../models/Income';
import { CreateIncomeRequestBody } from '../types/Income';
import { ddbDocClient } from './ddb-client';
import { BadRequestException, NotFoundException } from 'utils/Exceptions';

const SINGLE_TABLE_NAME = DDBConstants.DDB_TABLE_NAME;

export class IncomesService {
    constructor(private userId: string) {}

    private get incomePk() { return DDBConstants.PARTITIONS.INCOME(this.userId); }
    private get fundSourcePk() { return DDBConstants.PARTITIONS.FUND_SOURCE(this.userId); }

    async getIncome(timestamp: string): Promise<Income | null> {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND SK = :sk',
            ExpressionAttributeValues: {
                ':pk': this.incomePk,
                ':sk': timestamp,
            },
        });
        const response = await ddbDocClient.send(command);
        if (!response.Items || response.Items.length === 0) {
            return null;
        }
        return new Income(response.Items[0], this.userId);
    }

    async create(body: CreateIncomeRequestBody) {
        const income = new Income(body, this.userId);

        const transactCmd = new TransactWriteCommand({
            TransactItems: [
                {
                    Put: {
                        TableName: SINGLE_TABLE_NAME,
                        Item: income.toDdbItem(),
                    },
                },
                {
                    Update: {
                        TableName: SINGLE_TABLE_NAME,
                        Key: {
                            PK: this.fundSourcePk,
                            SK: body.fundSource,
                        },
                        UpdateExpression: 'SET balance = balance + :amt',
                        ConditionExpression: 'attribute_exists(PK)',
                        ExpressionAttributeValues: {
                            ':amt': body.amount,
                        },
                    },
                },
            ],
        });

        await ddbDocClient.send(transactCmd);
        return income.toNormalItem();
    }

    async getAll(month: string) {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk_prefix)',
            ExpressionAttributeValues: {
                ':pk': this.incomePk,
                ':sk_prefix': month,
            },
            ScanIndexForward: false,
        });
        const response = await ddbDocClient.send(command);
        const incomes = response.Items?.map((item) => new Income(item, this.userId).toNormalItem());
        return incomes || [];
    }

    async updateIncome(timestamp: string, body: Partial<CreateIncomeRequestBody>) {
        const checkIncome = await this.getIncome(timestamp);
        if (!checkIncome) {
            throw new NotFoundException('Income not found');
        }

        const existingIncome = checkIncome.toNormalItem();

        if (body.timestamp && body.timestamp !== existingIncome.timestamp) {
            const checkNewIncome = await this.getIncome(body.timestamp);
            if (checkNewIncome) {
                throw new BadRequestException('An income with the new timestamp already exists.');
            }
        }

        const updatedData = { ...existingIncome, ...body };
        const updatedIncome = new Income(updatedData, this.userId);

        const transactItems: any[] = [];

        if (body.timestamp && body.timestamp !== existingIncome.timestamp) {
            transactItems.push({
                Delete: {
                    TableName: SINGLE_TABLE_NAME,
                    Key: { PK: this.incomePk, SK: existingIncome.timestamp },
                },
            });
        }

        transactItems.push({
            Put: {
                TableName: SINGLE_TABLE_NAME,
                Item: updatedIncome.toDdbItem(),
            },
        });

        const oldAmount = existingIncome.amount;
        const newAmount = updatedData.amount;
        const oldFundSource = existingIncome.fundSource;
        const newFundSource = updatedData.fundSource;

        if (oldFundSource === newFundSource) {
            const diff = newAmount - oldAmount;
            if (diff !== 0) {
                if (diff > 0) {
                    transactItems.push({
                        Update: {
                            TableName: SINGLE_TABLE_NAME,
                            Key: { PK: this.fundSourcePk, SK: oldFundSource },
                            UpdateExpression: 'SET balance = balance + :diff',
                            ExpressionAttributeValues: { ':diff': diff },
                        },
                    });
                } else {
                    transactItems.push({
                        Update: {
                            TableName: SINGLE_TABLE_NAME,
                            Key: { PK: this.fundSourcePk, SK: oldFundSource },
                            UpdateExpression: 'SET balance = balance - :diff',
                            ConditionExpression: 'isCreditCard = :true OR balance >= :diff',
                            ExpressionAttributeValues: { ':diff': Math.abs(diff), ':true': true },
                        },
                    });
                }
            }
        } else {
            transactItems.push({
                Update: {
                    TableName: SINGLE_TABLE_NAME,
                    Key: { PK: this.fundSourcePk, SK: oldFundSource },
                    UpdateExpression: 'SET balance = balance - :amt',
                    ConditionExpression: 'isCreditCard = :true OR balance >= :amt',
                    ExpressionAttributeValues: { ':amt': oldAmount, ':true': true },
                },
            });
            transactItems.push({
                Update: {
                    TableName: SINGLE_TABLE_NAME,
                    Key: { PK: this.fundSourcePk, SK: newFundSource },
                    UpdateExpression: 'SET balance = balance + :amt',
                    ConditionExpression: 'attribute_exists(PK)',
                    ExpressionAttributeValues: { ':amt': newAmount },
                },
            });
        }

        const transactCmd = new TransactWriteCommand({ TransactItems: transactItems });
        await ddbDocClient.send(transactCmd);

        return updatedIncome;
    }

    async delete(timestamp: string) {
        const income = await this.getIncome(timestamp);
        if (!income) {
            throw new NotFoundException('Income not found');
        }

        const incomeItem = income.toNormalItem();

        const transactCmd = new TransactWriteCommand({
            TransactItems: [
                {
                    Delete: {
                        TableName: SINGLE_TABLE_NAME,
                        Key: {
                            PK: this.incomePk,
                            SK: timestamp,
                        },
                    },
                },
                {
                    Update: {
                        TableName: SINGLE_TABLE_NAME,
                        Key: {
                            PK: this.fundSourcePk,
                            SK: incomeItem.fundSource,
                        },
                        UpdateExpression: 'SET balance = balance - :amt',
                        ConditionExpression: 'isCreditCard = :true OR balance >= :amt',
                        ExpressionAttributeValues: {
                            ':amt': incomeItem.amount,
                            ':true': true,
                        },
                    },
                },
            ],
        });

        await ddbDocClient.send(transactCmd);
    }
}
