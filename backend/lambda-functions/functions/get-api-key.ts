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
import { getUserIdFromEvent } from 'utils/getUserId';
import { requestIdMiddleware } from 'utils/requestIdMiddleware';
import { ensureUserApiKey } from '../services/api-key';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        if (event.httpMethod === HttpMethod.OPTIONS) {
            return createSuccessResponse(HttpStatus.NO_CONTENT);
        }

        const userId = getUserIdFromEvent(event);
        if (!userId) {
            return createBadRequestResponse(HttpStatus.UNAUTHORIZED, 'Unauthorized');
        }

        // Lazily provisions the key if it doesn't exist yet (self-heals existing users).
        const { apiKey } = await ensureUserApiKey(userId);
        return createSuccessResponse(HttpStatus.OK, { apiKey });
    } catch (error) {
        console.error('Failed to resolve user API key:', error);
        return createServerErrorResponse();
    }
};

export const lambdaHandler = middy(handler)
    .use(
        cors({
            headers: 'Content-Type, Authorization, x-api-key',
            methods: 'GET, OPTIONS',
            origins: process.env.ALLOWED_ORIGINS?.split(',') ?? [],
        }),
    )
    .use(requestIdMiddleware());
