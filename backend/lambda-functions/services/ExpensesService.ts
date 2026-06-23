import { QueryCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import {
    createBadRequestResponse,
    createSuccessResponse,
    HttpStatus,
    isValidDate,
    DDBConstants,
} from 'ft-common-layer';
import { Expense } from '../models/Expense';
import { CreateExpenseRequestBody } from '../types/Expense';
import { ddbDocClient } from './ddb-client';
import { BadRequestException, NotFoundException } from 'utils/Exceptions';

const SINGLE_TABLE_NAME = DDBConstants.DDB_TABLE_NAME;

export class ExpensesService {
    constructor(private userId: string) {}

    private get expensePk() { return DDBConstants.PARTITIONS.EXPENSE(this.userId); }
    private get fundSourcePk() { return DDBConstants.PARTITIONS.FUND_SOURCE(this.userId); }

    async getExpense(timestamp: string): Promise<Expense | null> {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND SK = :sk',
            ExpressionAttributeValues: {
                ':pk': this.expensePk,
                ':sk': timestamp,
            },
        });
        const response = await ddbDocClient.send(command);
        if (!response.Items || response.Items.length === 0) {
            return null;
        }
        return new Expense(response.Items[0], this.userId);
    }

    async create(body: CreateExpenseRequestBody) {
        const expense = new Expense(body, this.userId);

        const transactCmd = new TransactWriteCommand({
            TransactItems: [
                {
                    Put: {
                        TableName: SINGLE_TABLE_NAME,
                        Item: expense.toDdbItem(),
                    },
                },
                {
                    Update: {
                        TableName: SINGLE_TABLE_NAME,
                        Key: {
                            PK: this.fundSourcePk,
                            SK: body.fundSource,
                        },
                        UpdateExpression: 'SET balance = balance - :amt',
                        ConditionExpression: 'attribute_exists(PK)',
                        ExpressionAttributeValues: {
                            ':amt': body.amount,
                        },
                    },
                },
            ],
        });

        await ddbDocClient.send(transactCmd);
        return expense.toNormalItem();
    }

    async getAll(month: string) {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk_prefix)',
            ExpressionAttributeValues: {
                ':pk': this.expensePk,
                ':sk_prefix': month,
            },
            ScanIndexForward: false,
        });
        const response = await ddbDocClient.send(command);
        const expenses = response.Items?.map((item) => new Expense(item, this.userId).toNormalItem());
        return expenses || [];
    }

    async deleteExpense(timestamp?: string) {
        if (!isValidDate(timestamp || '')) {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Invalid or missing timestamp');
        }

        await this.delete(timestamp || '');
        return createSuccessResponse(HttpStatus.NO_CONTENT);
    }

    async updateExpense(timestamp: string, body: Partial<CreateExpenseRequestBody>) {
        const checkExpense = await this.getExpense(timestamp);
        if (!checkExpense) {
            throw new NotFoundException('Expense not found');
        }

        const existingExpense = checkExpense.toNormalItem();

        if (body.timestamp && body.timestamp !== existingExpense.timestamp) {
            const checkNewExpense = await this.getExpense(body.timestamp);
            if (checkNewExpense) {
                throw new BadRequestException('An expense with the new timestamp already exists.');
            }
        }

        const updatedData = { ...existingExpense, ...body };
        const updatedExpense = new Expense(updatedData, this.userId);

        const transactItems: any[] = [];

        if (body.timestamp && body.timestamp !== existingExpense.timestamp) {
            transactItems.push({
                Delete: {
                    TableName: SINGLE_TABLE_NAME,
                    Key: { PK: this.expensePk, SK: existingExpense.timestamp },
                },
            });
        }

        transactItems.push({
            Put: {
                TableName: SINGLE_TABLE_NAME,
                Item: updatedExpense.toDdbItem(),
            },
        });

        const oldAmount = existingExpense.amount;
        const newAmount = updatedData.amount;
        const oldFundSource = existingExpense.fundSource;
        const newFundSource = updatedData.fundSource;

        if (oldFundSource === newFundSource) {
            // Net change to the single fund source. Allowed to go negative so
            // credit-card style sources can be overdrawn (mirrors create()).
            const delta = oldAmount - newAmount;
            if (delta !== 0) {
                transactItems.push({
                    Update: {
                        TableName: SINGLE_TABLE_NAME,
                        Key: { PK: this.fundSourcePk, SK: oldFundSource },
                        UpdateExpression: 'SET balance = balance + :delta',
                        ExpressionAttributeValues: { ':delta': delta },
                    },
                });
            }
        } else {
            // Refund the old fund source in full, then charge the new one.
            // The new source may go negative (credit-card support); we only
            // require that it exists.
            transactItems.push({
                Update: {
                    TableName: SINGLE_TABLE_NAME,
                    Key: { PK: this.fundSourcePk, SK: oldFundSource },
                    UpdateExpression: 'SET balance = balance + :amt',
                    ExpressionAttributeValues: { ':amt': oldAmount },
                },
            });
            transactItems.push({
                Update: {
                    TableName: SINGLE_TABLE_NAME,
                    Key: { PK: this.fundSourcePk, SK: newFundSource },
                    UpdateExpression: 'SET balance = balance - :amt',
                    ConditionExpression: 'attribute_exists(PK)',
                    ExpressionAttributeValues: { ':amt': newAmount },
                },
            });
        }

        const transactCmd = new TransactWriteCommand({ TransactItems: transactItems });
        await ddbDocClient.send(transactCmd);

        return updatedExpense;
    }

    async delete(timestamp: string) {
        const expense = await this.getExpense(timestamp);
        if (!expense) {
            throw new NotFoundException('Expense not found');
        }

        const expenseItem = expense.toNormalItem();

        const transactCmd = new TransactWriteCommand({
            TransactItems: [
                {
                    Delete: {
                        TableName: SINGLE_TABLE_NAME,
                        Key: {
                            PK: this.expensePk,
                            SK: timestamp,
                        },
                    },
                },
                {
                    Update: {
                        TableName: SINGLE_TABLE_NAME,
                        Key: {
                            PK: this.fundSourcePk,
                            SK: expenseItem.fundSource,
                        },
                        UpdateExpression: 'SET balance = balance + :amt',
                        ExpressionAttributeValues: {
                            ':amt': expenseItem.amount,
                        },
                    },
                },
            ],
        });

        await ddbDocClient.send(transactCmd);
    }
}
