import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handler } from '../../functions/expenses';
import { ExpensesService } from '../../services/ExpensesService';
import { expect, describe, it, jest, beforeEach, afterEach } from '@jest/globals';

describe('Unit test for expenses handler', function () {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(ExpensesService.prototype, 'getExpenses').mockResolvedValue({
            statusCode: 200,
            body: JSON.stringify({
                message: 'hello world',
            }),
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('verifies successful response', async () => {
        const event: APIGatewayProxyEvent = {
            httpMethod: 'GET',
            body: '',
            headers: {},
            isBase64Encoded: false,
            multiValueHeaders: {},
            multiValueQueryStringParameters: {},
            path: '/expenses',
            pathParameters: {},
            queryStringParameters: {},
            requestContext: {
                accountId: '123456789012',
                apiId: '1234',
                authorizer: {},
                httpMethod: 'get',
                identity: {
                    accessKey: '',
                    accountId: '',
                    apiKey: '',
                    apiKeyId: '',
                    caller: '',
                    clientCert: {
                        clientCertPem: '',
                        issuerDN: '',
                        serialNumber: '',
                        subjectDN: '',
                        validity: { notAfter: '', notBefore: '' },
                    },
                    cognitoAuthenticationProvider: '',
                    cognitoAuthenticationType: '',
                    cognitoIdentityId: '',
                    cognitoIdentityPoolId: '',
                    principalOrgId: '',
                    sourceIp: '',
                    user: '',
                    userAgent: '',
                    userArn: '',
                },
                path: '/hello',
                protocol: 'HTTP/1.1',
                requestId: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
                requestTimeEpoch: 1428582896000,
                resourceId: '123456',
                resourcePath: '/hello',
                stage: 'dev',
            },
            resource: '',
            stageVariables: {},
        };
        const result: APIGatewayProxyResult = await handler(event);

        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual(
            JSON.stringify({
                message: 'hello world',
            }),
        );
    });
});
