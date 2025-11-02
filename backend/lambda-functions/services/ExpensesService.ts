import { PutCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
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
const EXPENSE_PK = DDBConstants.PARTITIONS.EXPENSE;
export class ExpensesService {
    async getExpense(timestamp: string): Promise<Expense | null> {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND SK = :sk',
            ExpressionAttributeValues: {
                ':pk': EXPENSE_PK,
                ':sk': timestamp,
            },
        });
        const response = await ddbDocClient.send(command);
        if (!response.Items || response.Items.length === 0) {
            return null;
        }
        return new Expense(response.Items[0]);
    }

    async create(body: CreateExpenseRequestBody) {
        const expense = new Expense(body);
        const command = new PutCommand({
            TableName: SINGLE_TABLE_NAME,
            Item: expense.toDdbItem(),
        });

        await ddbDocClient.send(command);

        return expense.toNormalItem();
    }

    async getAll(month: string) {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk_prefix)',
            ExpressionAttributeValues: {
                ':pk': EXPENSE_PK,
                ':sk_prefix': month,
            },
            ScanIndexForward: false, // order by SK descending (latest first)
        });
        const response = await ddbDocClient.send(command);
        const expenses = response.Items?.map((item) => new Expense(item).toNormalItem());
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
        // Fetch existing expense
        const checkExpense = await this.getExpense(timestamp);
        if (!checkExpense) {
            throw new NotFoundException('Expense not found');
        }

        const existingExpense = checkExpense.toNormalItem();

        // If the timestamp is changed in the update, we need to delete the old item
        if (body.timestamp && body.timestamp !== existingExpense.timestamp) {
            // need to check if the new timestamp already exists
            const checkNewExpense = await this.getExpense(body.timestamp);
            if (checkNewExpense) {
                throw new BadRequestException('An expense with the new timestamp already exists.');
            }

            await this.delete(existingExpense.timestamp);
        }
        const updatedData = { ...existingExpense, ...body };
        const updatedExpense = new Expense(updatedData);
        const putCmd = new PutCommand({
            TableName: SINGLE_TABLE_NAME,
            Item: updatedExpense.toDdbItem(),
        });
        await ddbDocClient.send(putCmd);

        return updatedExpense;
    }
    async delete(timestamp: string) {
        const deleteCmd = new DeleteCommand({
            TableName: SINGLE_TABLE_NAME,
            Key: {
                PK: EXPENSE_PK,
                SK: timestamp,
            },
        });
        await ddbDocClient.send(deleteCmd);
    }
}

export default new ExpensesService();
