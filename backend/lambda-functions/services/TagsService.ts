import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DDBConstants } from 'ft-common-layer';
import { ddbDocClient } from './ddb-client';
import { Tags } from 'models/Tags';

const SINGLE_TABLE_NAME = DDBConstants.DDB_TABLE_NAME;
const TAGS_PK = DDBConstants.PARTITIONS.TAGS;

export class TagsService {
    async getAll() {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': TAGS_PK,
            },
        });
        const response = await ddbDocClient.send(command);
        const tags = response.Items?.map((item) => new Tags(item).toNormalItem());
        return tags || [];
    }
}

export default new TagsService();
