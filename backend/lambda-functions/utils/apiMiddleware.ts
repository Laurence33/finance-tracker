import middy from '@middy/core';
import cors from '@middy/http-cors';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { requestIdMiddleware } from './requestIdMiddleware';
import { cacheControlMiddleware } from './cacheControlMiddleware';

type Handler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

/**
 * The middleware every HTTP handler needs, in one place.
 *
 * Previously each handler wired this stack by hand, which meant a new endpoint
 * silently opted out of whatever it forgot — and two of these are easy to forget
 * and invisible when missing:
 *
 * - `maxAge` sends `Access-Control-Max-Age`. Without it browsers fall back to a
 *   ~5s preflight cache, and since this API is cross-origin and takes
 *   `Authorization` + `x-api-key`, nearly every request would be preceded by an
 *   OPTIONS that reaches Lambda — roughly doubling the bill.
 * - `cacheControlMiddleware` marks GETs `no-store`, keeping the browser's HTTP
 *   cache out of a system where SWR owns staleness. See
 *   `docs/adr/0001-swr-owns-client-get-caching.md`.
 *
 * `methods` is the only thing that legitimately varies per endpoint.
 */
export function withApiMiddleware(handler: Handler, methods: string) {
    return middy(handler)
        .use(
            cors({
                headers: 'Content-Type, Authorization, x-api-key',
                methods,
                origins: process.env.ALLOWED_ORIGINS?.split(',') ?? [],
                // One day. Preflights are pure overhead and the CORS policy here
                // is static, so there is nothing to invalidate sooner.
                maxAge: 86400,
            }),
        )
        .use(requestIdMiddleware())
        .use(cacheControlMiddleware());
}
