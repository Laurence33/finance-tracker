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

  async updateExpense(timestamp: string, body: Partial<CreateExpenseRequestBody>) {
    if (!isValidDate(timestamp)) {
      return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Invalid or missing timestamp');
    }

    const validationResult = CreateExpenseValidator.partial().safeParse(body);
    if (!validationResult.success) {
      const errors = treeifyError(validationResult.error).properties;
      return createBadRequestResponse(
        HttpStatus.BAD_REQUEST,
        'Validation failed',
        errors
      );
    }

    // Fetch existing expense
    const getCmd = new QueryCommand({
      TableName: SINGLE_TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': EXPENSE_PK,
        ':sk': timestamp,
      },
    });
    const getResponse = await ddbDocClient.send(getCmd);
    if (!getResponse.Items || getResponse.Items.length === 0) {
      return createBadRequestResponse(HttpStatus.NOT_FOUND, 'Expense not found');
    }


    const existingExpense = new Expense(getResponse.Items[0], true).toNormalItem();

    // If the timestamp is changed in the update, we need to delete the old item
    if (
      validationResult.data.timestamp &&
      validationResult.data.timestamp !== existingExpense.timestamp
    ) {
      // need to check if the new timestamp already exists
      const checkCmd = new QueryCommand({
        TableName: SINGLE_TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND SK = :sk',
        ExpressionAttributeValues: {
          ':pk': EXPENSE_PK,
          ':sk': validationResult.data.timestamp,
        },
      });
      const checkResult = await ddbDocClient.send(checkCmd);
      if (checkResult.Items && checkResult.Items.length > 0) {
        return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'An expense with the new timestamp already exists.');
      }

      const deleteCmd = new DeleteCommand({
        TableName: SINGLE_TABLE_NAME,
        Key: {
          PK: EXPENSE_PK,
          SK: existingExpense.timestamp,
        },
      });
      await ddbDocClient.send(deleteCmd);
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