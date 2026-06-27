import { describe, it, expect } from '@jest/globals';
import {
    allocationDiffItems,
    expenseBucketDiffItems,
    bucketIncrementItem,
} from '../../utils/bucketTransact';

const USER = 'u1';

// Pull the (key, delta) pair out of a generated transact Update item.
function deltaOf(item: any): { key: string; delta: number } {
    return {
        key: item.Update.Key.SK,
        delta: item.Update.ExpressionAttributeValues[':delta'],
    };
}

describe('bucketIncrementItem', () => {
    it('builds a bucket-scoped, negative-allowing increment', () => {
        const item = bucketIncrementItem(USER, 'NEC', -50);
        expect(item.Update.Key.PK).toBe(`USER#${USER}#Bucket`);
        expect(item.Update.Key.SK).toBe('NEC');
        expect(item.Update.UpdateExpression).toContain('if_not_exists(balance, :zero)');
        expect(item.Update.ExpressionAttributeValues[':delta']).toBe(-50);
        // No balance-floor condition: buckets may go negative.
        expect(item.Update).not.toHaveProperty('ConditionExpression');
    });
});

describe('allocationDiffItems (income)', () => {
    it('create: adds each allocation', () => {
        const items = allocationDiffItems(USER, {}, { NEC: 55, FFA: 10 });
        const map = Object.fromEntries(items.map(deltaOf).map((d) => [d.key, d.delta]));
        expect(map).toEqual({ NEC: 55, FFA: 10 });
    });

    it('delete: subtracts each allocation', () => {
        const items = allocationDiffItems(USER, { NEC: 55, GIVE: 5 }, {});
        const map = Object.fromEntries(items.map(deltaOf).map((d) => [d.key, d.delta]));
        expect(map).toEqual({ NEC: -55, GIVE: -5 });
    });

    it('re-split: emits per-bucket deltas and skips unchanged buckets', () => {
        const items = allocationDiffItems(USER, { NEC: 55, FFA: 10, PLAY: 10 }, { NEC: 40, FFA: 25, PLAY: 10 });
        const map = Object.fromEntries(items.map(deltaOf).map((d) => [d.key, d.delta]));
        expect(map).toEqual({ NEC: -15, FFA: 15 }); // PLAY unchanged -> omitted
    });

    it('never emits two updates for the same bucket key', () => {
        const items = allocationDiffItems(USER, { NEC: 55 }, { NEC: 60 });
        const keys = items.map((i) => i.Update.Key.SK);
        expect(new Set(keys).size).toBe(keys.length);
    });
});

describe('expenseBucketDiffItems', () => {
    it('create (no old bucket): charges the new bucket', () => {
        const items = expenseBucketDiffItems(USER, '', 0, 'PLAY', 30);
        expect(items.map(deltaOf)).toEqual([{ key: 'PLAY', delta: -30 }]);
    });

    it('same bucket, amount increase: deducts the extra', () => {
        const items = expenseBucketDiffItems(USER, 'NEC', 20, 'NEC', 50);
        expect(items.map(deltaOf)).toEqual([{ key: 'NEC', delta: -30 }]);
    });

    it('same bucket, amount decrease: refunds the difference', () => {
        const items = expenseBucketDiffItems(USER, 'NEC', 50, 'NEC', 20);
        expect(items.map(deltaOf)).toEqual([{ key: 'NEC', delta: 30 }]);
    });

    it('same bucket, no change: no items', () => {
        expect(expenseBucketDiffItems(USER, 'NEC', 50, 'NEC', 50)).toEqual([]);
    });

    it('bucket switch: refunds old in full, charges new in full', () => {
        const items = expenseBucketDiffItems(USER, 'NEC', 40, 'PLAY', 25);
        const map = Object.fromEntries(items.map(deltaOf).map((d) => [d.key, d.delta]));
        expect(map).toEqual({ NEC: 40, PLAY: -25 });
        // Two different keys -> no collision.
        expect(items.length).toBe(2);
    });

    it('delete (no new bucket): refunds the old bucket', () => {
        const items = expenseBucketDiffItems(USER, 'GIVE', 15, '', 0);
        expect(items.map(deltaOf)).toEqual([{ key: 'GIVE', delta: 15 }]);
    });
});
