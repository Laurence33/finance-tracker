import { withApiMiddleware } from 'utils/apiMiddleware';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    HttpMethod,
    HttpStatus,
    createBadRequestResponse,
    createSuccessResponse,
    createServerErrorResponse,
} from 'ft-common-layer';
import { getUserIdFromEvent } from 'utils/getUserId';
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

export const lambdaHandler = withApiMiddleware(handler, 'GET, OPTIONS');
