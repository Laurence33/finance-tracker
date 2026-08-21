import { describe, it, expect } from '@jest/globals';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { cacheControlMiddleware } from '../../utils/cacheControlMiddleware';

// Minimal middy-shaped request: the middleware only reads event.httpMethod
// and mutates response.headers.
function requestFor(httpMethod: string, response: APIGatewayProxyResult | null) {
    return {
        event: { httpMethod } as APIGatewayProxyEvent,
        response,
        context: {} as Context,
    } as any;
}

const after = cacheControlMiddleware().after!;

describe('cacheControlMiddleware', () => {
    it('marks a GET response no-store so only SWR caches it', async () => {
        const request = requestFor('GET', { statusCode: 200, body: '{}' });
        await after(request);
        expect(request.response.headers!['Cache-Control']).toBe('private, no-store');
    });

    // The trap this middleware exists to avoid: createSuccessResponse is shared
    // with the OPTIONS branch of every handler, so putting the header there
    // would land it on the preflight and undo Access-Control-Max-Age.
    it('leaves a preflight response untouched', async () => {
        const request = requestFor('OPTIONS', { statusCode: 204, body: '' });
        await after(request);
        expect(request.response.headers?.['Cache-Control']).toBeUndefined();
    });

    it.each(['POST', 'PATCH', 'PUT', 'DELETE'])(
        'leaves a %s response untouched',
        async (method) => {
            const request = requestFor(method, { statusCode: 200, body: '{}' });
            await after(request);
            expect(request.response.headers?.['Cache-Control']).toBeUndefined();
        },
    );

    it('preserves headers set by other middleware', async () => {
        const request = requestFor('GET', {
            statusCode: 200,
            body: '{}',
            headers: { 'x-request-id': 'abc' },
        });
        await after(request);
        expect(request.response.headers).toEqual({
            'x-request-id': 'abc',
            'Cache-Control': 'private, no-store',
        });
    });

    it('does nothing when there is no response', () => {
        const request = requestFor('GET', null);
        expect(() => after(request)).not.toThrow();
        expect(request.response).toBeNull();
    });
});
