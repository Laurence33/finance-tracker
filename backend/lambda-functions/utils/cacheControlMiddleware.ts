import { MiddlewareObj } from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Marks GET responses uncacheable by the browser, so the SWR cache on the client
 * is the only cache with a clock. Two caches expiring independently means SWR can
 * "revalidate" into the browser's HTTP cache and never reach the network — which
 * would make pull-to-refresh silently do nothing. See
 * `docs/adr/0001-swr-owns-client-get-caching.md`.
 *
 * Deliberately keyed on the request method rather than set inside
 * `createSuccessResponse`: that helper is shared with the OPTIONS branch of every
 * handler, and a Cache-Control on the preflight would undermine the
 * Access-Control-Max-Age that halves this app's request count.
 */
export const cacheControlMiddleware = (): MiddlewareObj<
    APIGatewayProxyEvent,
    APIGatewayProxyResult
> => ({
    after: (request) => {
        if (request.event?.httpMethod !== 'GET') return;
        if (!request.response) return;
        request.response.headers = {
            ...(request.response.headers || {}),
            'Cache-Control': 'private, no-store',
        };
    },
});
