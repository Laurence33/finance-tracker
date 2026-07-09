import { DeleteCommand, PutCommand, QueryCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { DDBConstants } from 'ft-common-layer';
import { ddbDocClient } from './ddb-client';
import { Asset } from 'models/Asset';

const SINGLE_TABLE_NAME = DDBConstants.DDB_TABLE_NAME;

export class AssetsService {
    constructor(private userId: string) {}

    private get assetPk() { return DDBConstants.PARTITIONS.ASSET(this.userId); }
    private get fundSourcePk() { return DDBConstants.PARTITIONS.FUND_SOURCE(this.userId); }

    async getAll() {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': this.assetPk,
            },
            ScanIndexForward: false,
        });
        const response = await ddbDocClient.send(command);
        const assets = response.Items?.map((item) => new Asset(item, this.userId).toNormalItem());
        return assets || [];
    }

    async getAsset(timestamp: string) {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND SK = :sk',
            ExpressionAttributeValues: {
                ':pk': this.assetPk,
                ':sk': timestamp,
            },
        });
        const response = await ddbDocClient.send(command);
        if (response.Items && response.Items.length > 0) {
            return new Asset(response.Items[0], this.userId);
        }
        return null;
    }

    async create(data: any) {
        const asset = new Asset(data, this.userId);

        // No fund source selected: plain write, no balance movement.
        if (!data.fundSource) {
            const putCmd = new PutCommand({
                TableName: SINGLE_TABLE_NAME,
                Item: asset.toDdbItem(),
            });
            await ddbDocClient.send(putCmd);
            return asset.toNormalItem();
        }

        // Deduct the asset's value from the chosen fund source in one atomic
        // transaction. No expense record is written — this is a one-time
        // cash-to-asset transfer. The condition rejects a missing fund source
        // and blocks an overdraw unless it is a credit card (mirrors the
        // expense-create deduction in ExpensesService).
        const transactCmd = new TransactWriteCommand({
            TransactItems: [
                {
                    Put: {
                        TableName: SINGLE_TABLE_NAME,
                        Item: asset.toDdbItem(),
                    },
                },
                {
                    Update: {
                        TableName: SINGLE_TABLE_NAME,
                        Key: {
                            PK: this.fundSourcePk,
                            SK: data.fundSource,
                        },
                        UpdateExpression: 'SET balance = balance - :amt',
                        ConditionExpression: 'attribute_exists(PK) AND (isCreditCard = :true OR balance >= :amt)',
                        ExpressionAttributeValues: {
                            ':amt': data.value,
                            ':true': true,
                        },
                    },
                },
            ],
        });
        await ddbDocClient.send(transactCmd);
        return asset.toNormalItem();
    }

    async update(timestamp: string, body: any) {
        const asset = await this.getAsset(timestamp);
        if (!asset) {
            throw new Error('Asset not found.');
        }

        const existingItem = asset.toNormalItem();
        const updatedAsset = new Asset(
            {
                ...existingItem,
                ...body,
                SK: existingItem.timestamp,
            },
            this.userId,
        );

        const putCmd = new PutCommand({
            TableName: SINGLE_TABLE_NAME,
            Item: updatedAsset.toDdbItem(),
        });
        await ddbDocClient.send(putCmd);

        return updatedAsset.toNormalItem();
    }

    async delete(timestamp: string) {
        const deleteCmd = new DeleteCommand({
            TableName: SINGLE_TABLE_NAME,
            Key: {
                PK: this.assetPk,
                SK: timestamp,
            },
        });
        await ddbDocClient.send(deleteCmd);
    }
}
