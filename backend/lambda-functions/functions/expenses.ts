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
import { ExpensesController } from 'controllers/ExpensesController';
import { getUserIdFromEvent } from 'utils/getUserId';
import { requestIdMiddleware } from 'utils/requestIdMiddleware';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        if (event.httpMethod === HttpMethod.OPTIONS) {
            return createSuccessResponse(HttpStatus.NO_CONTENT);
        }

        const userId = getUserIdFromEvent(event);
        if (!userId) {
            return createBadRequestResponse(HttpStatus.UNAUTHORIZED, 'Unauthorized');
        }

        const controller = new ExpensesController(userId);
        const timestamp = event.queryStringParameters?.timestamp;
        switch (event.httpMethod) {
            case HttpMethod.GET:
                const month = event.queryStringParameters?.month || new Date().toISOString().slice(0, 7);
                return await controller.get(month);
            case HttpMethod.POST:
                const body = JSON.parse(event.body || '{}') as CreateExpenseRequestBody;
                return await controller.post(body);
            case HttpMethod.PATCH:
                const putBody = JSON.parse(event.body || '{}') as CreateExpenseRequestBody;
                return await controller.patch(timestamp || '', putBody);
            case HttpMethod.DELETE:
                return await controller.delete(timestamp);
            default:
                return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Invalid request method.');
        }
    } catch (err) {
        console.log(err);
        return createServerErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, 'Unexpected error occurred.');
    }
};

export const lambdaHandler = middy(handler)
    .use(
        cors({
            headers: 'Content-Type, Authorization',
            methods: 'POST, OPTIONS, DELETE, PATCH, GET',
            origins: process.env.ALLOWED_ORIGINS?.split(',') ?? [],
        }),
    )
    .use(requestIdMiddleware());
