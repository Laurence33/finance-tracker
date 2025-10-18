import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { treeifyError } from 'zod';
import {
    createSuccessResponse,
    HttpStatus,
    DDBConstants,
    createBadRequestResponse,
    generateValidationErrors,
} from 'ft-common-layer';
import { ddbDocClient } from './ddb-client';
import { FundSource } from 'models/FundSource';
import { CreateFundSourceValidator } from 'validators/CreateFundSourceValidator';

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
        const response = await ddbDocClient.send(command);
        const fundSources = response.Items?.map((item) => new FundSource(item).toNormalItem());
        return createSuccessResponse(HttpStatus.OK, {
            message: 'Fund Sources retrieved successfully',
            data: {
                fundSources,
            },
        });
    }

    async create(data: any) {
        const validationResult = CreateFundSourceValidator.safeParse(data);

        if (!validationResult.success) {
            const errors = treeifyError(validationResult.error).properties;
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Validation failed', errors);
        }

        // Let's do code level check, since we do not expect a large number of fund sources
        const getAllCmd = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': EXPENSE_PK,
            },
        });
        const getAllResponse = await ddbDocClient.send(getAllCmd);
        if (getAllResponse.Items?.length) {
            let hasErrors = false;
            const errors: Record<string, string[]> = {
                name: [],
                displayText: [],
            };
            for (const item of getAllResponse.Items) {
                if (item.SK === validationResult.data.name) {
                    errors.name.push('Name already in use.');
                    hasErrors = true;
                }
                if (item.displayText === validationResult.data.displayText) {
                    errors.displayText.push('Display text already in use.');
                    hasErrors = true;
                }
            }

            if (hasErrors) {
                console.log('Validation errors:', errors);
                return createBadRequestResponse(
                    HttpStatus.BAD_REQUEST,
                    'Validation failed',
                    generateValidationErrors(errors),
                );
            }
        }

        const fundSource = new FundSource(validationResult.data);
        const command = new PutCommand({
            TableName: SINGLE_TABLE_NAME,
            Item: fundSource.toDdbItem(),
        });

        await ddbDocClient.send(command);

        return createSuccessResponse(HttpStatus.OK, {
            message: 'Fund Source recorded successfully',
            data: fundSource.toNormalItem(),
        });
    }
}
