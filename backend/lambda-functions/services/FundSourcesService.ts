import { DeleteCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DDBConstants } from 'ft-common-layer';
import { ddbDocClient } from './ddb-client';
import { FundSource } from 'models/FundSource';
import { NotFoundException } from 'utils/Exceptions';

const SINGLE_TABLE_NAME = DDBConstants.DDB_TABLE_NAME;

export class FundSourcesService {
    constructor(private userId: string) {}

    private get fundSourcePk() { return DDBConstants.PARTITIONS.FUND_SOURCE(this.userId); }
    private get expensePk() { return DDBConstants.PARTITIONS.EXPENSE(this.userId); }

    async getAll() {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': this.fundSourcePk,
            },
        });
        const response = await ddbDocClient.send(command);
        const fundSources = response.Items?.map((item) => new FundSource(item, this.userId).toNormalItem());
        return fundSources || [];
    }

    async create(data: any) {
        const fundSource = new FundSource(data, this.userId);
        const command = new PutCommand({
            TableName: SINGLE_TABLE_NAME,
            Item: fundSource.toDdbItem(),
        });
        await ddbDocClient.send(command);

        return fundSource.toNormalItem();
    }

    async delete(name: string) {
        const deleteCmd = new DeleteCommand({
            TableName: SINGLE_TABLE_NAME,
            Key: {
                PK: this.fundSourcePk,
                SK: name,
            },
        });
        await ddbDocClient.send(deleteCmd);
    }

    async update(name: string, body: any) {
        const checkFundSource = await this.getFundSource(name);
        if (!checkFundSource) {
            throw new NotFoundException('Fund source not found.');
        }

        const existingFundSource = checkFundSource.toNormalItem();

        const updatedData = { ...existingFundSource, ...body };
        const updatedFundSource = new FundSource(updatedData, this.userId);
        const putCmd = new PutCommand({
            TableName: SINGLE_TABLE_NAME,
            Item: updatedFundSource.toDdbItem(),
        });
        await ddbDocClient.send(putCmd);

        return updatedFundSource.toNormalItem();
    }

    async checkInUse(fundSourceName: string): Promise<boolean> {
        const checkCmd = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND LSI1SK = :sk',
            IndexName: 'LSI1',
            ExpressionAttributeValues: {
                ':pk': this.expensePk,
                ':sk': fundSourceName,
            },
            Limit: 1,
        });
        const checkResponse = await ddbDocClient.send(checkCmd);
        if (!checkResponse.Items) return false;
        return checkResponse.Items?.length > 0;
    }

    async getFundSource(name: string) {
        const getCmd = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND SK = :sk',
            ExpressionAttributeValues: {
                ':pk': this.fundSourcePk,
                ':sk': name,
            },
        });
        const response = await ddbDocClient.send(getCmd);
        if (response.Items && response.Items.length > 0) {
            return new FundSource(response.Items[0], this.userId);
        } else {
            return null;
        }
    }
}
