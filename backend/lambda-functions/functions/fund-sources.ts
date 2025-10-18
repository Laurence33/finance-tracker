import middy from '@middy/core';
import cors from '@middy/http-cors';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { HttpMethod, HttpStatus, createBadRequestResponse, createServerErrorResponse } from 'ft-common-layer';
import { FundSourcesService } from 'services/FundSourcesService';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const fundSourcesService = new FundSourcesService();
        switch (event.httpMethod) {
            case HttpMethod.GET:
                return await fundSourcesService.getAll();
            case HttpMethod.POST:
                return await fundSourcesService.create(event.body ? JSON.parse(event.body) : {});
            default:
                return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Invalid request method.');
        }
    } catch (err) {
        console.log(err);
        return createServerErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, 'Unexpected error occurred.');
    }
};

export const lambdaHandler = middy()
    .use(
        cors({
            headers: 'Content-Type',
            methods: 'GET, OPTIONS',
            origins: ['http://localhost:8001'], // TODO: maybe put this to the env variables
        }),
    )
    .handler(handler);
