import middy from '@middy/core';
import cors from '@middy/http-cors';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { HttpMethod } from 'ft-common-layer/types/HttpMethod';
import { CreateExpenseRequestBody } from './types/Expense';
import { Expense, EXPENSE_PK } from './models/Expense';

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);
const SINGLE_TABLE_NAME = process.env.DDB_TABLE_NAME || 'SingleTable';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        switch (event.httpMethod) {
            case HttpMethod.GET:
                return await getExpenses();
            case HttpMethod.POST:
                const body = JSON.parse(event.body || '{}') as CreateExpenseRequestBody;
                return await createExpense(body);
            case HttpMethod.OPTIONS:
                return {
                    statusCode: 204,
                    body: '',
                };
            default:
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        message: 'Invalid request method.',
                    }),
                };
        }
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Unexpected error occurred',
            }),
        };
    }
};

export async function createExpense(body: CreateExpenseRequestBody) {
    // {
    //     "timestamp": "2025-08-17T10:14:52",
    //     "amount": 250,
    //     "fundSource": "cash",
    // }
    if (!body?.timestamp || !body?.fundSource || !body?.amount) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: 'Invalid request body. Required fields: amount, fundSource, timestamp.',
            }),
        };
    }

    const expense = new Expense(body);
    const command = new PutCommand({
        TableName: SINGLE_TABLE_NAME,
        Item: expense.toDdbItem(),
    });

    await docClient.send(command);

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Expense recorded successfully',
            data: expense.toNormalItem(),
        }),
    };
}

export async function getExpenses() {
    const command = new QueryCommand({
        TableName: SINGLE_TABLE_NAME,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
            ":pk": EXPENSE_PK
        }
    });
    const response = await docClient.send(command);
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Expenses retrieved successfully',
            data: response.Items?.map(item => new Expense(item, true).toNormalItem()),
        }),
    };
}

export const lambdaHandler = middy()
    .use(
        cors({
            headers: 'Content-Type',
            methods: 'POST, OPTIONS',
            origins: ['http://localhost:8001'],
        }),
    )
    .handler(handler);
