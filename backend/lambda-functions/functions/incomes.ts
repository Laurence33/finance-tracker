import middy from '@middy/core';
import cors from '@middy/http-cors';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { IncomesController } from 'controllers/IncomesController';
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

        const controller = new IncomesController(userId);
        const timestamp = event.queryStringParameters?.timestamp;
        const month = event.queryStringParameters?.month || new Date().toISOString().slice(0, 7);

        switch (event.httpMethod) {
            case HttpMethod.GET:
                return await controller.get(month);
            case HttpMethod.POST:
                return await controller.post(event.body ? JSON.parse(event.body) : {});
            case HttpMethod.PATCH:
                return await controller.patch(timestamp || '', event.body ? JSON.parse(event.body) : {});
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
            methods: 'GET, OPTIONS, POST, PATCH, DELETE',
            origins: process.env.ALLOWED_ORIGINS?.split(',') ?? [],
        }),
    )
    .use(requestIdMiddleware());
