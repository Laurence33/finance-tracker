import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
    region: 'ap-southeast-1',
});
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

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
                body: '',
            };
        } else if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body || '{}');
            console.log('Received POST request with body:', body);

            // {
            //     "PK": "Expense#Expense",
            //     "SK": "2025-08-17 10:14:52",
            //     "amount": 250
            // }
            if (!body.PK || !body.SK || !body.amount) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        message: 'Invalid request body. Required fields: PK, SK, time, amount.',
                    }),
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type',
                    },
                };
            }

            const tableName = process.env.DDB_TABLE_NAME || "SingleTable";
            console.log('Using DynamoDB table:', tableName);
            const command = new PutCommand({
                TableName: tableName,
                Item: body,
            });
            const response = await docClient.send(command);
            console.log('DynamoDB response:', response);

            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'Expense recorded successfully',
                    data: body,
                }),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
            };
        }
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'hello world',
            }),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        };
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'some error happened',
            }),
        };
    }
};
