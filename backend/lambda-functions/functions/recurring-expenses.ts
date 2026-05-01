import middy from '@middy/core';
import cors from '@middy/http-cors';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { RecurringExpensesController } from 'controllers/RecurringExpensesController';
import {
    HttpMethod,
    HttpStatus,
    createBadRequestResponse,
    createServerErrorResponse,
    createSuccessResponse,
} from 'ft-common-layer';
import { getUserIdFromEvent } from 'utils/getUserId';
import { requestIdMiddleware } from 'utils/requestIdMiddleware';

const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        if (event.httpMethod === HttpMethod.OPTIONS) {
            return createSuccessResponse(HttpStatus.NO_CONTENT);
        }

        const userId = getUserIdFromEvent(event);
        if (!userId) {
            return createBadRequestResponse(HttpStatus.UNAUTHORIZED, 'Unauthorized');
        }

        const controller = new RecurringExpensesController(userId);
        const name = event.pathParameters?.name;
        const path = event.resource;
        const body = event.body ? JSON.parse(event.body) : {};

        if (path === '/recurring-expenses/{name}/pay') {
            if (event.httpMethod === HttpMethod.POST) {
                return await controller.pay(name!, body);
            }
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Invalid request method.');
        }

        if (path === '/recurring-expenses/{name}/payments') {
            if (event.httpMethod === HttpMethod.GET) {
                return await controller.getPayments(name!);
            }
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Invalid request method.');
        }

        if (path === '/recurring-expenses/{name}/status') {
            if (event.httpMethod === HttpMethod.PATCH) {
                return await controller.updateStatus(name, body);
            }
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Invalid request method.');
        }

        switch (event.httpMethod) {
            case HttpMethod.GET:
                return await controller.get();
            case HttpMethod.POST:
                return await controller.post(body);
            case HttpMethod.PATCH:
                return await controller.patch(name, body);
            case HttpMethod.DELETE:
                return await controller.delete(name);
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
            methods: 'GET, OPTIONS, POST, PATCH, DELETE',
            origins: ['http://localhost:8001'],
        }),
    )
    .use(requestIdMiddleware());
