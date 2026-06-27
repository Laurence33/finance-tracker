import { DDBConstants } from 'ft-common-layer';

const SINGLE_TABLE_NAME = DDBConstants.DDB_TABLE_NAME;

/**
 * A TransactWrite Update item that adds `delta` to a bucket's balance.
 * Buckets are allowed to go negative (overspend is informative), so there is
 * no balance-floor condition. `if_not_exists` guards against a bucket whose
 * `balance` attribute is somehow absent.
 */
export function bucketIncrementItem(userId: string, bucketKey: string, delta: number) {
    return {
        Update: {
            TableName: SINGLE_TABLE_NAME,
            Key: { PK: DDBConstants.PARTITIONS.BUCKET(userId), SK: bucketKey },
            UpdateExpression: 'SET balance = if_not_exists(balance, :zero) + :delta',
            ExpressionAttributeValues: { ':delta': delta, ':zero': 0 },
        },
    };
}

/**
 * Reconciles a change in an income's allocation map. Returns one bucket-increment
 * item per bucket whose allocated amount changed (delta = new - old). Used for
 * create ({} -> new), update (old -> new) and delete (old -> {}).
 */
export function allocationDiffItems(
    userId: string,
    oldAllocations: Record<string, number> = {},
    newAllocations: Record<string, number> = {},
) {
    const keys = new Set([...Object.keys(oldAllocations), ...Object.keys(newAllocations)]);
    const items: any[] = [];
    for (const key of keys) {
        const delta = (newAllocations[key] || 0) - (oldAllocations[key] || 0);
        if (delta !== 0) {
            items.push(bucketIncrementItem(userId, key, delta));
        }
    }
    return items;
}

/**
 * Reconciles a change to an expense's bucket assignment. An expense reduces its
 * bucket by its amount, so on edit we refund the old bucket and re-charge the new
 * one (or, when the bucket is unchanged, apply just the amount delta). Never emits
 * two updates against the same bucket key.
 */
export function expenseBucketDiffItems(
    userId: string,
    oldBucket: string,
    oldAmount: number,
    newBucket: string,
    newAmount: number,
) {
    const items: any[] = [];
    if (oldBucket && oldBucket === newBucket) {
        const delta = oldAmount - newAmount; // balance += (old - new)
        if (delta !== 0) {
            items.push(bucketIncrementItem(userId, oldBucket, delta));
        }
    } else {
        if (oldBucket) {
            items.push(bucketIncrementItem(userId, oldBucket, oldAmount)); // refund
        }
        if (newBucket) {
            items.push(bucketIncrementItem(userId, newBucket, -newAmount)); // charge
        }
    }
    return items;
}
