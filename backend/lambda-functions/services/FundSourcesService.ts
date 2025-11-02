import { DeleteCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DDBConstants } from 'ft-common-layer';
import { ddbDocClient } from './ddb-client';
import { FundSource } from 'models/FundSource';
import { NotFoundException } from 'utils/Exceptions';

const SINGLE_TABLE_NAME = DDBConstants.DDB_TABLE_NAME;
const FUND_SOURCE_PK = DDBConstants.PARTITIONS.FUND_SOURCE;
const EXPENSE_PK = DDBConstants.PARTITIONS.EXPENSE;

export class FundSourcesService {
    async getAll() {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': FUND_SOURCE_PK,
            },
        });
        const response = await ddbDocClient.send(command);
        const fundSources = response.Items?.map((item) => new FundSource(item).toNormalItem());
        return fundSources || [];
    }

    async create(data: any) {
        const fundSource = new FundSource(data);
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
                PK: FUND_SOURCE_PK,
                SK: name,
            },
        });
        await ddbDocClient.send(deleteCmd);
    }

    async update(name: string, body: any) {
        const checkFundSource = await getFundSource(name);
        if (!checkFundSource) {
            throw new NotFoundException('Fund source not found.');
        }

        const existingExpense = checkFundSource.toNormalItem();

        const updatedData = { ...existingExpense, ...body };
        const updatedFundSource = new FundSource(updatedData);
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
                ':pk': EXPENSE_PK,
                ':sk': fundSourceName,
            },
            Limit: 1, // we only need to know if at least one exists
        });
        const checkResponse = await ddbDocClient.send(checkCmd);
        if (!checkResponse.Items) return false;
        return checkResponse.Items?.length > 0;
    }
}

async function getFundSource(name: string) {
    const getCmd = new QueryCommand({
        TableName: SINGLE_TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND SK = :sk',
        ExpressionAttributeValues: {
            ':pk': FUND_SOURCE_PK,
            ':sk': name,
        },
    });
    const response = await ddbDocClient.send(getCmd);
    if (response.Items && response.Items.length > 0) {
        return new FundSource(response.Items[0]);
    } else {
        return null;
    }
}

export async function getAllFundSources() {
    const command = new QueryCommand({
        TableName: SINGLE_TABLE_NAME,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
            ':pk': FUND_SOURCE_PK,
        },
    });
    const response = await ddbDocClient.send(command);
    const fundSources = response.Items?.map((item) => new FundSource(item).toNormalItem());
    return fundSources || [];
}

export default new FundSourcesService();
