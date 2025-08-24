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
      return createBadRequestResponse(
        HttpStatus.BAD_REQUEST,
        'Validation failed',
        errors
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
      data: response.Items?.map((item) => new Expense(item, true).toNormalItem()),
    });
  }

  async deleteExpense(timestamp?: string) {
    if (!isValidDate(timestamp || '')) {
      return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Invalid or missing timestamp');
    }

    const deleteCmd = new DeleteCommand({
      TableName: SINGLE_TABLE_NAME,
      Key: {
        PK: EXPENSE_PK,
        SK: timestamp,
      },
    });
    await ddbDocClient.send(deleteCmd);

    return createSuccessResponse(HttpStatus.NO_CONTENT);
  }
}