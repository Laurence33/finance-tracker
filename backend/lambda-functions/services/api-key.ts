import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import {
    APIGatewayClient,
    CreateApiKeyCommand,
    CreateUsagePlanKeyCommand,
    DeleteApiKeyCommand,
    GetUsagePlansCommand,
} from '@aws-sdk/client-api-gateway';
import { DDBConstants } from 'ft-common-layer';
import { ddbDocClient } from './ddb-client';

const apiGatewayClient = new APIGatewayClient();

export interface UserApiKey {
    apiKeyId: string;
    apiKey: string;
}

// Resolve the usage plan ID by name at runtime. We can't pass the ID via env var
// because !Ref ApiUsagePlan would create a circular CloudFormation dependency
// (Api -> Function -> UsagePlan -> Api). Memoized after the first lookup.
let cachedUsagePlanId: string | undefined;

const resolveUsagePlanId = async (): Promise<string> => {
    if (cachedUsagePlanId) return cachedUsagePlanId;

    const planName = process.env.USAGE_PLAN_NAME;
    if (!planName) {
        throw new Error('USAGE_PLAN_NAME env var is not set');
    }

    let position: string | undefined;
    do {
        const res = await apiGatewayClient.send(new GetUsagePlansCommand({ position }));
        const match = res.items?.find((p) => p.name === planName);
        if (match?.id) {
            cachedUsagePlanId = match.id;
            return cachedUsagePlanId;
        }
        position = res.position;
    } while (position);

    throw new Error(`Usage plan "${planName}" not found`);
};

const profileKey = (userId: string) => ({
    PK: DDBConstants.PARTITIONS.PROFILE(userId),
    SK: 'Profile',
});

const readStoredKey = async (userId: string): Promise<UserApiKey | undefined> => {
    const res = await ddbDocClient.send(
        new GetCommand({
            TableName: DDBConstants.DDB_TABLE_NAME,
            Key: profileKey(userId),
        }),
    );
    const item = res.Item;
    if (item?.apiKey && item?.apiKeyId) {
        return { apiKeyId: item.apiKeyId as string, apiKey: item.apiKey as string };
    }
    return undefined;
};

/**
 * Returns the user's throttling API key, creating and persisting one on first call.
 * Idempotent and safe under concurrent invocation (signup trigger + lazy fetch).
 */
export const ensureUserApiKey = async (userId: string): Promise<UserApiKey> => {
    const existing = await readStoredKey(userId);
    if (existing) return existing;

    const usagePlanId = await resolveUsagePlanId();

    // Create the key and associate it with the per-user usage plan.
    const created = await apiGatewayClient.send(
        new CreateApiKeyCommand({ name: `user-${userId}`, enabled: true }),
    );
    const apiKeyId = created.id;
    const apiKey = created.value;
    if (!apiKeyId || !apiKey) {
        throw new Error('CreateApiKey returned no id/value');
    }

    await apiGatewayClient.send(
        new CreateUsagePlanKeyCommand({
            usagePlanId,
            keyId: apiKeyId,
            keyType: 'API_KEY',
        }),
    );

    try {
        await ddbDocClient.send(
            new PutCommand({
                TableName: DDBConstants.DDB_TABLE_NAME,
                Item: {
                    ...profileKey(userId),
                    apiKeyId,
                    apiKey,
                    createdAt: new Date().toISOString(),
                },
                ConditionExpression: 'attribute_not_exists(PK)',
            }),
        );
    } catch (err) {
        // Lost a concurrent race — another invocation already stored a key.
        // Discard the orphan we just created and return the persisted winner.
        if ((err as { name?: string })?.name === 'ConditionalCheckFailedException') {
            await apiGatewayClient
                .send(new DeleteApiKeyCommand({ apiKey: apiKeyId }))
                .catch(() => {});
            const winner = await readStoredKey(userId);
            if (winner) return winner;
        }
        throw err;
    }

    return { apiKeyId, apiKey };
};
