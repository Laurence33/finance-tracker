import { GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DDBConstants } from 'ft-common-layer';
import { FRAMEWORKS, FrameworkDefinition } from 'models/frameworkDefinitions';
import { ddbDocClient } from './ddb-client';

const SINGLE_TABLE_NAME = DDBConstants.DDB_TABLE_NAME;
const FRAMEWORK_PK = DDBConstants.GLOBAL_PARTITIONS.FRAMEWORK;

/**
 * Serves budgeting framework definitions from DynamoDB (global partition
 * `FRAMEWORK`, SK = framework id — shared by all users). The code definitions
 * in `frameworkDefinitions.ts` act as versioned seeds: any seed missing from
 * the table, or with a higher `version` than the stored item, is written on
 * read. Frameworks that exist only in the table are served untouched, so new
 * ones can be added without a deploy.
 */
export class FrameworkService {
    private toDdbItem(def: FrameworkDefinition) {
        return { PK: FRAMEWORK_PK, SK: def.id, ...def };
    }

    private toDefinition(item: Record<string, any>): FrameworkDefinition {
        return {
            id: item.SK ?? item.id,
            label: item.label,
            description: item.description ?? '',
            bucketLabel: item.bucketLabel,
            bucketLabelPlural: item.bucketLabelPlural,
            order: item.order ?? 0,
            version: item.version ?? 0,
            buckets: item.buckets ?? [],
        };
    }

    async listFrameworks(): Promise<FrameworkDefinition[]> {
        const response = await ddbDocClient.send(
            new QueryCommand({
                TableName: SINGLE_TABLE_NAME,
                KeyConditionExpression: 'PK = :pk',
                ExpressionAttributeValues: { ':pk': FRAMEWORK_PK },
            }),
        );
        const stored = new Map<string, FrameworkDefinition>(
            (response.Items ?? []).map((item) => {
                const def = this.toDefinition(item);
                return [def.id, def];
            }),
        );

        // Sync seeds: write any that are missing or outdated.
        for (const seed of Object.values(FRAMEWORKS)) {
            const existing = stored.get(seed.id);
            if (!existing || existing.version < seed.version) {
                await ddbDocClient.send(
                    new PutCommand({ TableName: SINGLE_TABLE_NAME, Item: this.toDdbItem(seed) }),
                );
                stored.set(seed.id, seed);
            }
        }

        return [...stored.values()].sort((a, b) => a.order - b.order);
    }

    async getFramework(id: string): Promise<FrameworkDefinition | null> {
        if (!id) return null;
        const response = await ddbDocClient.send(
            new GetCommand({
                TableName: SINGLE_TABLE_NAME,
                Key: { PK: FRAMEWORK_PK, SK: id },
            }),
        );
        const stored = response.Item ? this.toDefinition(response.Item) : null;
        const seed = FRAMEWORKS[id];
        if (seed && (!stored || stored.version < seed.version)) {
            await ddbDocClient.send(
                new PutCommand({ TableName: SINGLE_TABLE_NAME, Item: this.toDdbItem(seed) }),
            );
            return seed;
        }
        return stored;
    }
}
