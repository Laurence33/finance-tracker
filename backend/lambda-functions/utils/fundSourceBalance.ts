import { DDBConstants } from 'ft-common-layer';

const SINGLE_TABLE_NAME = DDBConstants.DDB_TABLE_NAME;

/**
 * The debit rule: a credit card may always be debited (its balance may go
 * negative); any other fund source only up to what it holds.
 */
export function canDebitFundSource(
    fundSource: { isCreditCard?: boolean; balance: number | string },
    amount: number,
): boolean {
    if (fundSource.isCreditCard) return true;
    return Number(fundSource.balance) >= amount;
}

/**
 * A TransactWrite Update item that adds `delta` to a fund source's balance.
 * Always conditioned on the fund source existing, so it can never create one.
 * A debit (negative delta) also carries the debit rule as a concurrency-safe
 * backstop: credit card, or enough balance to cover it.
 */
export function fundSourceAdjustmentItem(userId: string, fundSourceName: string, delta: number) {
    const update: any = {
        TableName: SINGLE_TABLE_NAME,
        Key: { PK: DDBConstants.PARTITIONS.FUND_SOURCE(userId), SK: fundSourceName },
        UpdateExpression: 'SET balance = balance + :delta',
        ConditionExpression: 'attribute_exists(PK)',
        ExpressionAttributeValues: { ':delta': delta } as Record<string, any>,
    };
    if (delta < 0) {
        update.ConditionExpression = 'attribute_exists(PK) AND (isCreditCard = :true OR balance >= :needed)';
        update.ExpressionAttributeValues[':needed'] = -delta;
        update.ExpressionAttributeValues[':true'] = true;
    }
    return { Update: update };
}
