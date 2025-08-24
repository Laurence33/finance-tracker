/* eslint-disable prettier/prettier */
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { createBadRequestResponse, createSuccessResponse, HttpStatus } from 'ft-common-layer';
import { Expense, EXPENSE_PK } from 'models/Expense';
import { CreateExpenseRequestBody } from 'types/Expense';
import { ddbDocClient } from './ddb-client';

const SINGLE_TABLE_NAME = process.env.DDB_TABLE_NAME || 'SingleTable';

export class ExpensesService {
  async createExpense(body: CreateExpenseRequestBody) {
    // {
    //     "timestamp": "2025-08-17T10:14:52",
    //     "amount": 250,
    //     "fundSource": "cash",
    // }
    // TODO: move this to a validator middleware
    if (!body?.timestamp || !body?.fundSource || !body?.amount) {
      return createBadRequestResponse(
        HttpStatus.BAD_REQUEST,
        'Invalid request body. Required fields: amount, fundSource, timestamp.',
      );
    }

    const expense = new Expense(body);
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
}