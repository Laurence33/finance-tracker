import { withApiMiddleware } from 'utils/apiMiddleware';
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

export const lambdaHandler = withApiMiddleware(handler, 'GET, OPTIONS, PUT, DELETE');
