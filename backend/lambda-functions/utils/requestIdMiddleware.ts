import { MiddlewareObj } from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const attachHeader = (response: APIGatewayProxyResult | null | undefined, context: Context) => {
    if (!response) return;
    response.headers = {
        ...(response.headers || {}),
        'x-request-id': context.awsRequestId,
    };
};

export const requestIdMiddleware = (): MiddlewareObj<
    APIGatewayProxyEvent,
    APIGatewayProxyResult
> => ({
    after: (request) => {
        attachHeader(request.response, request.context);
    },
    onError: (request) => {
        attachHeader(request.response, request.context);
    },
});
