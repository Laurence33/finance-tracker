import { DeleteCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
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
import { UpdateFundSourceValidator } from 'validators/UpdateFundSourceValidator';

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
                ':pk': FUND_SOURCE_PK,
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

    async delete(name: string | undefined) {
        if (!name) {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Fund source name is required for deletion.');
        }

        const checkCmd = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND LSI1SK = :sk',
            IndexName: 'LSI1',
            ExpressionAttributeValues: {
                ':pk': EXPENSE_PK,
                ':sk': name,
            },
            Limit: 1, // we only need to know if at least one exists
        });
        const checkResponse = await ddbDocClient.send(checkCmd);
        if (checkResponse.Items && checkResponse.Items.length > 0) {
            return createBadRequestResponse(
                HttpStatus.BAD_REQUEST,
                'Cannot delete fund source that is in use by expenses.',
            );
        }

        const deleteCmd = new DeleteCommand({
            TableName: SINGLE_TABLE_NAME,
            Key: {
                PK: FUND_SOURCE_PK,
                SK: name,
            },
        });
        await ddbDocClient.send(deleteCmd);

        return createSuccessResponse(HttpStatus.NO_CONTENT);
    }

    async update(name: string | undefined, body: any) {
        if (!name) {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Fund source name is required for update.');
        }

        const validationResult = UpdateFundSourceValidator.partial().safeParse(body);
        if (!validationResult.success) {
            const errors = treeifyError(validationResult.error).properties;
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Validation failed', errors);
        }

        const checkFundSource = await getFundSource(name);
        if (!checkFundSource) {
            return createBadRequestResponse(HttpStatus.NOT_FOUND, 'Fund Source not found');
        }

        const existingExpense = checkFundSource.toNormalItem();

        const updatedData = { ...existingExpense, ...validationResult.data };
        const updatedFundSource = new FundSource(updatedData);
        const putCmd = new PutCommand({
            TableName: SINGLE_TABLE_NAME,
            Item: updatedFundSource.toDdbItem(),
        });
        await ddbDocClient.send(putCmd);

        return createSuccessResponse(HttpStatus.OK, {
            message: 'Fund Source updated successfully',
            data: updatedFundSource.toNormalItem(),
        });
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
