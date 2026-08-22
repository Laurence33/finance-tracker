import { describe, it, expect } from '@jest/globals';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { withApiMiddleware } from '../../utils/apiMiddleware';

const ORIGIN = 'https://finance-tracker.laurencecortez.com';
process.env.ALLOWED_ORIGINS = ORIGIN;

const handler = withApiMiddleware(
    async () => ({ statusCode: 200, body: '{}' }),
    'GET, OPTIONS, POST',
);

const invoke = (httpMethod: string) =>
    (handler as any)(
        {
            httpMethod,
            headers: { origin: ORIGIN, Origin: ORIGIN },
        } as unknown as APIGatewayProxyEvent,
        { awsRequestId: 'req-1' } as Context,
    );

describe('withApiMiddleware', () => {
    // Without this, browsers fall back to a ~5s preflight cache and nearly every
    // cross-origin GET is preceded by an OPTIONS that reaches Lambda.
    it('sends Access-Control-Max-Age on the preflight', async () => {
        const response = await invoke('OPTIONS');
        expect(response.headers['Access-Control-Max-Age']).toBe('86400');
    });

    it('marks GET responses no-store', async () => {
        const response = await invoke('GET');
        expect(response.headers['Cache-Control']).toBe('private, no-store');
    });

    // Cache-Control on the preflight would undermine the max-age above.
    it('leaves the preflight free of Cache-Control', async () => {
        const response = await invoke('OPTIONS');
        expect(response.headers['Cache-Control']).toBeUndefined();
    });

    it('does not mark mutations no-store', async () => {
        const response = await invoke('POST');
        expect(response.headers['Cache-Control']).toBeUndefined();
    });

    it('still attaches the request id', async () => {
        const response = await invoke('GET');
        expect(response.headers['x-request-id']).toBe('req-1');
    });
});
