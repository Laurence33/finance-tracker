import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { createSuccessResponse, HttpStatus, DDBConstants } from 'ft-common-layer';
import { ddbDocClient } from './ddb-client';
import { FundSource } from 'models/FundSource';

const SINGLE_TABLE_NAME = DDBConstants.DDB_TABLE_NAME;
const EXPENSE_PK = DDBConstants.PARTITIONS.FUND_SOURCE;

export class FundSourcesService {
    async getAll() {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': EXPENSE_PK,
            },
        });
        console.log('Executing query for fund sources', command.input);
        const response = await ddbDocClient.send(command);
        const fundSources = response.Items?.map((item) => new FundSource(item).toNormalItem());
        return createSuccessResponse(HttpStatus.OK, {
            message: 'Fund Sources retrieved successfully',
            data: {
                fundSources,
            },
        });
    }
}
