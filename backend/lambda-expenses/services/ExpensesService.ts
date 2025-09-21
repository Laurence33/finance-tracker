/* eslint-disable prettier/prettier */
import { PutCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { treeifyError } from 'zod/v4';
import { createBadRequestResponse, createSuccessResponse, HttpStatus, isValidDate } from 'ft-common-layer';
import { CreateExpenseValidator } from 'validators/CreateExpenseValidator';
import { Expense, EXPENSE_PK } from 'models/Expense';
import { CreateExpenseRequestBody } from 'types/Expense';
import { ddbDocClient } from './ddb-client';

const SINGLE_TABLE_NAME = process.env.DDB_TABLE_NAME || 'SingleTable';
export class ExpensesService {
    async createExpense(body: CreateExpenseRequestBody) {
        const validationResult = CreateExpenseValidator.safeParse(body);
        if (!validationResult.success) {
            const errors = treeifyError(validationResult.error).properties;
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Validation failed', errors);
        }

        const checkExpense = await getExpense(validationResult.data.timestamp);
        if (checkExpense) {
            return createBadRequestResponse(
                HttpStatus.BAD_REQUEST,
                'An expense with the same timestamp already exists.',
            );
        }

        const expense = new Expense(validationResult.data);
        const command = new PutCommand({
            TableName: SINGLE_TABLE_NAME,
            Item: expense.toDdbItem(),
        });

        await ddbDocClient.send(command);

        return createSuccessResponse(HttpStatus.OK, {
            message: 'Expense recorded successfully',
            data: expense.toNormalItem(),
        });
    }

    async getExpenses() {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': EXPENSE_PK,
            },
        });
        const response = await ddbDocClient.send(command);
        return createSuccessResponse(HttpStatus.OK, {
            message: 'Expenses retrieved successfully',
            data: response.Items?.map((item) => new Expense(item).toNormalItem()),
        });
    }

    async deleteExpense(timestamp?: string) {
        if (!isValidDate(timestamp || '')) {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Invalid or missing timestamp');
        }

        await deleteExpenseItem(timestamp || '');
        return createSuccessResponse(HttpStatus.NO_CONTENT);
    }

    async updateExpense(timestamp: string, body: Partial<CreateExpenseRequestBody>) {
        if (!isValidDate(timestamp)) {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Invalid or missing timestamp');
        }

        const validationResult = CreateExpenseValidator.partial().safeParse(body);
        if (!validationResult.success) {
            const errors = treeifyError(validationResult.error).properties;
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Validation failed', errors);
        }

        // Fetch existing expense
        const checkExpense = await getExpense(timestamp);
        if (!checkExpense) {
            return createBadRequestResponse(HttpStatus.NOT_FOUND, 'Expense not found');
        }

        const existingExpense = checkExpense.toNormalItem();

        // If the timestamp is changed in the update, we need to delete the old item
        if (validationResult.data.timestamp && validationResult.data.timestamp !== existingExpense.timestamp) {
            // need to check if the new timestamp already exists
            const checkNewExpense = await getExpense(validationResult.data.timestamp);
            if (checkNewExpense) {
                return createBadRequestResponse(
                    HttpStatus.BAD_REQUEST,
                    'An expense with the new timestamp already exists.',
                );
            }

            await deleteExpenseItem(existingExpense.timestamp);
        }

        const updatedData = { ...existingExpense, ...validationResult.data };
        const updatedExpense = new Expense(updatedData);
        const putCmd = new PutCommand({
            TableName: SINGLE_TABLE_NAME,
            Item: updatedExpense.toDdbItem(),
        });
        await ddbDocClient.send(putCmd);

        return createSuccessResponse(HttpStatus.OK, {
            message: 'Expense updated successfully',
            data: updatedExpense.toNormalItem(),
        });
    }
}

async function deleteExpenseItem(timestamp: string) {
    const deleteCmd = new DeleteCommand({
        TableName: SINGLE_TABLE_NAME,
        Key: {
            PK: EXPENSE_PK,
            SK: timestamp,
        },
    });
    await ddbDocClient.send(deleteCmd);
}

async function getExpense(timestamp: string): Promise<Expense | null> {
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
