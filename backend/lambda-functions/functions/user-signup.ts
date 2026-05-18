import { PostConfirmationTriggerEvent } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { DDBConstants } from 'ft-common-layer';
import { ddbDocClient } from '../services/ddb-client';

const DEFAULT_TAGS = [
    'Food',
    'Transport',
    'Groceries',
    'Bills',
    'Entertainment',
    'Health',
    'Shopping',
    'Other',
];

export const lambdaHandler = async (
    event: PostConfirmationTriggerEvent,
): Promise<PostConfirmationTriggerEvent> => {
    // Only seed on sign-up confirmation — skip forgot-password / admin-confirm flows.
    if (event.triggerSource !== 'PostConfirmation_ConfirmSignUp') {
        return event;
    }

    const userId = event.request.userAttributes.sub;
    if (!userId) {
        console.warn('PostConfirmation fired without sub; skipping tag seed.');
        return event;
    }

    const pk = DDBConstants.PARTITIONS.TAGS(userId);
    const createdAt = new Date().toISOString();

    const results = await Promise.allSettled(
        DEFAULT_TAGS.map((name) =>
            ddbDocClient.send(
                new PutCommand({
                    TableName: DDBConstants.DDB_TABLE_NAME,
                    Item: { PK: pk, SK: name, budget: 0, createdAt },
                    // Preserve any existing tag (e.g. if the trigger re-fires) rather than overwriting budget.
                    ConditionExpression: 'attribute_not_exists(PK)',
                }),
            ),
        ),
    );

    results.forEach((r, i) => {
        if (r.status === 'rejected') {
            const err = r.reason as { name?: string };
            if (err?.name !== 'ConditionalCheckFailedException') {
                console.error(`Failed to seed tag "${DEFAULT_TAGS[i]}" for ${userId}:`, r.reason);
            }
        }
    });

    // Never throw — a failure here must not block the user's sign-up confirmation.
    return event;
};
