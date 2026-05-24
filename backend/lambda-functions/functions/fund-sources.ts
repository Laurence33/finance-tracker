import middy from '@middy/core';
import cors from '@middy/http-cors';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { FundSourcesController } from 'controllers/FundSourcesController';
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

        const controller = new FundSourcesController(userId);
        const name = event.pathParameters?.name;
        switch (event.httpMethod) {
            case HttpMethod.GET:
                return await controller.get();
            case HttpMethod.POST:
                return await controller.post(event.body ? JSON.parse(event.body) : {});
            case HttpMethod.PATCH:
                return await controller.patch(name, event.body ? JSON.parse(event.body) : {});
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
            origins: process.env.ALLOWED_ORIGINS?.split(',') ?? [],
        }),
    )
    .use(requestIdMiddleware());
