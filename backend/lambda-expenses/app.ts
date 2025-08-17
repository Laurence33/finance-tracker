import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import middy from '@middy/core'
import cors from '@middy/http-cors'
import jsonBodyParser from '@middy/http-json-body-parser'

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

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
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 204,
                body: '',
            };
        } else if (event.httpMethod === 'POST') {
            const body: any = event.body;
            // {
            //     "timestamp": "2025-08-17T10:14:52",
            //     "amount": 250,
            //     "fundSource": "cash",
            // }
            if (!body?.amount || !body?.fundSource || !body?.amount) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        message: 'Invalid request body. Required fields: amount, fundSource, timestamp.',
                    }),
                };
            }

            const tableName = process.env.DDB_TABLE_NAME || "SingleTable";
            const newExpenseItem = {
                PK: 'Expense#Expense',
                SK: body.timestamp.replace('T', ' '),
                fundSource: body.fundSource,
                amount: body.amount,
            };
            const command = new PutCommand({
                TableName: tableName,
                Item: newExpenseItem,
            });
            await docClient.send(command);
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'Expense recorded successfully',
                    data: newExpenseItem,
                }),
            };
        }
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'hello world',
            }),
        };
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

export const lambdaHandler = middy()
    .use(jsonBodyParser())
    .use(cors({
        headers: 'Content-Type',
        methods: 'POST, OPTIONS',
        origins: ['http://localhost:3001']
    }))
    .handler(handler);