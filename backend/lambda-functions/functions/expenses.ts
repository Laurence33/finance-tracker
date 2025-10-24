import middy from '@middy/core';
import cors from '@middy/http-cors';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    HttpMethod,
    HttpStatus,
    createBadRequestResponse,
    createSuccessResponse,
    createServerErrorResponse,
} from 'ft-common-layer';
import { CreateExpenseRequestBody } from '../types/Expense';
import { ExpensesService } from '../services/ExpensesService';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const expensesService = new ExpensesService();
        const timestamp = event.queryStringParameters?.timestamp;
        switch (event.httpMethod) {
            case HttpMethod.GET:
                const month = event.queryStringParameters?.month || new Date().toISOString().slice(0, 7);
                return await expensesService.getExpenses(month);
            case HttpMethod.POST:
                const body = JSON.parse(event.body || '{}') as CreateExpenseRequestBody;
                return await expensesService.createExpense(body);
            case HttpMethod.PATCH:
                const putBody = JSON.parse(event.body || '{}') as CreateExpenseRequestBody;
                return await expensesService.updateExpense(timestamp || '', putBody);
            case HttpMethod.DELETE:
                return await expensesService.deleteExpense(timestamp);
            case HttpMethod.OPTIONS:
                return createSuccessResponse(HttpStatus.NO_CONTENT);
            default:
                return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Invalid request method.');
        }
    } catch (err) {
        console.log(err);
        return createServerErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, 'Unexpected error occurred.');
    }
};

export const lambdaHandler = middy(handler).use(
    cors({
        headers: 'Content-Type',
        methods: 'POST, OPTIONS, DELETE, PATCH',
        origins: ['http://localhost:8001'], // TODO: maybe put this to the env variables
    }),
);
