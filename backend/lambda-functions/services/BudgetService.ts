import { PutCommand, QueryCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { DDBConstants } from 'ft-common-layer';
import { BudgetConfig } from 'models/BudgetConfig';
import { Bucket } from 'models/Bucket';
import { BadRequestException } from 'utils/Exceptions';
import { ddbDocClient } from './ddb-client';
import { FrameworkService } from './FrameworkService';

const SINGLE_TABLE_NAME = DDBConstants.DDB_TABLE_NAME;

type SetConfigBody = {
    enabled: boolean;
    framework?: string;
    initialAllocations?: Record<string, number>;
    // When true, overwrite the balances of buckets that already exist (used to
    // intentionally reset/re-seed on re-enable). When false/absent, existing
    // balances are preserved so accumulated funds are never wiped.
    reseed?: boolean;
};

export class BudgetService {
    private frameworkService = new FrameworkService();

    constructor(private userId: string) {}

    private get configPk() { return DDBConstants.PARTITIONS.BUDGET_CONFIG(this.userId); }
    private get bucketPk() { return DDBConstants.PARTITIONS.BUCKET(this.userId); }

    async getConfig(): Promise<{ enabled: boolean; framework: string }> {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND SK = :sk',
            ExpressionAttributeValues: { ':pk': this.configPk, ':sk': 'CONFIG' },
        });
        const response = await ddbDocClient.send(command);
        if (!response.Items || response.Items.length === 0) {
            return { enabled: false, framework: '' };
        }
        return new BudgetConfig(response.Items[0], this.userId).toNormalItem();
    }

    async getBuckets() {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: { ':pk': this.bucketPk },
        });
        const response = await ddbDocClient.send(command);
        const buckets = response.Items?.map((item) => new Bucket(item, this.userId).toNormalItem()) || [];
        buckets.sort((a, b) => a.order - b.order);
        return buckets;
    }

    /** Returns config, the framework's display metadata, and the buckets with balances. */
    async getBudget() {
        const config = await this.getConfig();
        const buckets = await this.getBuckets();
        const framework = config.framework
            ? await this.frameworkService.getFramework(config.framework)
            : null;
        return {
            config,
            framework: framework
                ? {
                      id: framework.id,
                      label: framework.label,
                      description: framework.description,
                      bucketLabel: framework.bucketLabel,
                      bucketLabelPlural: framework.bucketLabelPlural,
                  }
                : null,
            buckets,
        };
    }

    /**
     * Enable/disable the framework. Enabling seeds one bucket item per framework
     * bucket. Seeding is idempotent: existing bucket balances are preserved, so
     * toggling off and on again never wipes accumulated balances. `initialAllocations`
     * only applies to buckets that don't yet exist.
     */
    async setConfig(body: SetConfigBody) {
        if (!body.enabled) {
            // Disable: keep buckets (and their balances) intact, just flip the flag.
            const existing = await this.getConfig();
            const config = new BudgetConfig({ enabled: false, framework: existing.framework }, this.userId);
            await ddbDocClient.send(
                new PutCommand({ TableName: SINGLE_TABLE_NAME, Item: config.toDdbItem() }),
            );
            return this.getBudget();
        }

        const framework = body.framework
            ? await this.frameworkService.getFramework(body.framework)
            : null;
        if (!framework) {
            throw new BadRequestException('Unknown budgeting framework.');
        }

        const existingBuckets = await this.getBuckets();
        const existingKeys = new Set(existingBuckets.map((b) => b.key));

        const transactItems: any[] = [
            {
                Put: {
                    TableName: SINGLE_TABLE_NAME,
                    Item: new BudgetConfig({ enabled: true, framework: framework.id }, this.userId).toDdbItem(),
                },
            },
        ];

        for (const def of framework.buckets) {
            const exists = existingKeys.has(def.key);
            // Preserve an existing bucket's balance unless an explicit re-seed was requested.
            if (exists && !body.reseed) continue;
            const startingBalance = body.initialAllocations?.[def.key] ?? 0;
            const bucket = new Bucket(
                {
                    key: def.key,
                    displayLabel: def.displayLabel,
                    percentage: def.percentage,
                    order: def.order,
                    balance: startingBalance,
                },
                this.userId,
            );
            transactItems.push({
                Put: { TableName: SINGLE_TABLE_NAME, Item: bucket.toDdbItem() },
            });
        }

        await ddbDocClient.send(new TransactWriteCommand({ TransactItems: transactItems }));
        return this.getBudget();
    }

    /**
     * Permanently removes the framework: deletes every bucket item and the config
     * item. Irreversible — bucket balances are lost. (Past income `allocations` and
     * expense `bucket` fields are left as-is; they become inert references.)
     */
    async deleteBudget() {
        const buckets = await this.getBuckets();
        const transactItems: any[] = buckets.map((b) => ({
            Delete: { TableName: SINGLE_TABLE_NAME, Key: { PK: this.bucketPk, SK: b.key } },
        }));
        transactItems.push({
            Delete: { TableName: SINGLE_TABLE_NAME, Key: { PK: this.configPk, SK: 'CONFIG' } },
        });
        await ddbDocClient.send(new TransactWriteCommand({ TransactItems: transactItems }));
    }
}
