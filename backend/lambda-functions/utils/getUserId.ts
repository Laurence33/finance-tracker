import { APIGatewayProxyEvent } from 'aws-lambda';

const decodeJwtSub = (token: string): string | undefined => {
    const parts = token.split('.');
    if (parts.length !== 3) return undefined;
    try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        return typeof payload.sub === 'string' ? payload.sub : undefined;
    } catch {
        return undefined;
    }
};

export const getUserIdFromEvent = (event: APIGatewayProxyEvent): string | undefined => {
    const sub = event.requestContext.authorizer?.claims?.sub;
    if (sub) return sub;

    if (process.env.AWS_SAM_LOCAL === 'true') {
        const authHeader = event.headers?.Authorization || event.headers?.authorization;
        if (!authHeader?.startsWith('Bearer ')) return undefined;
        return decodeJwtSub(authHeader.slice(7));
    }

    return undefined;
};
