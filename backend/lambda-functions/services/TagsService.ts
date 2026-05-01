import { DeleteCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DDBConstants } from 'ft-common-layer';
import { ddbDocClient } from './ddb-client';
import { Tags } from 'models/Tags';

const SINGLE_TABLE_NAME = DDBConstants.DDB_TABLE_NAME;

export class TagsService {
    constructor(private userId: string) {}

    private get tagsPk() { return DDBConstants.PARTITIONS.TAGS(this.userId); }
    private get expensePk() { return DDBConstants.PARTITIONS.EXPENSE(this.userId); }

    async getAll() {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': this.tagsPk,
            },
        });
        const response = await ddbDocClient.send(command);
        const tags = response.Items?.map((item) => new Tags(item, this.userId).toNormalItem());
        return tags || [];
    }

    async create(data: any) {
        const tag = new Tags(data, this.userId);
        const command = new PutCommand({
            TableName: SINGLE_TABLE_NAME,
            Item: tag.toDdbItem(),
        });
        await ddbDocClient.send(command);
        return tag.toNormalItem();
    }

    async delete(name: string) {
        const deleteCmd = new DeleteCommand({
            TableName: SINGLE_TABLE_NAME,
            Key: {
                PK: this.tagsPk,
                SK: name,
            },
        });
        await ddbDocClient.send(deleteCmd);
    }

    async update(oldName: string, newName: string, budget: number = 0) {
        // Delete old item and create new one since SK (name) is the key
        await this.delete(oldName);
        return await this.create({ name: newName, budget });
    }

    async checkInUse(tag: Tags): Promise<boolean> {
        const item = tag.toNormalItem();
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :date)',
            FilterExpression: 'contains(tags, :tag)',
            ExpressionAttributeValues: {
                ':pk': this.expensePk,
                ':tag': item.name,
                ':date': item.createdAt?.toISOString().split('T')[0],
            },
            Limit: 50,
        });
        const response = await ddbDocClient.send(command);
        console.log('Response.Items:', response.Items);
        return (response.Items?.length ?? 0) > 0;
    }

    async getTag(name: string) {
        const getCmd = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND SK = :sk',
            ExpressionAttributeValues: {
                ':pk': this.tagsPk,
                ':sk': name,
            },
        });
        const response = await ddbDocClient.send(getCmd);
        if (response.Items && response.Items.length > 0) {
            return new Tags(response.Items[0], this.userId);
        }
        return null;
    }
}
