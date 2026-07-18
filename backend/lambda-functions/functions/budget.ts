import middy from '@middy/core';
import cors from '@middy/http-cors';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BudgetController } from 'controllers/BudgetController';
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

        const controller = new BudgetController(userId);

        if (event.resource === '/budget/frameworks') {
            if (event.httpMethod === HttpMethod.GET) {
                return await controller.getFrameworks();
            }
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Invalid request method.');
        }

        switch (event.httpMethod) {
            case HttpMethod.GET:
                return await controller.get();
            case HttpMethod.PUT:
                return await controller.put(event.body ? JSON.parse(event.body) : {});
            case HttpMethod.DELETE:
                return await controller.delete();
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
            headers: 'Content-Type, Authorization, x-api-key',
            methods: 'GET, OPTIONS, PUT, DELETE',
            origins: process.env.ALLOWED_ORIGINS?.split(',') ?? [],
        }),
    )
    .use(requestIdMiddleware());
