import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export const dynamoDBClient = new DynamoDBClient();
export const ddbDocClient = DynamoDBDocumentClient.from(dynamoDBClient);