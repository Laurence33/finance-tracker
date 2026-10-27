import { describe, it, expect } from '@jest/globals';
import { canDebitFundSource, fundSourceAdjustmentItem } from '../../utils/fundSourceBalance';

const USER = 'u1';

describe('canDebitFundSource', () => {
    it('always allows a credit card at zero balance', () => {
        expect(canDebitFundSource({ isCreditCard: true, balance: 0 }, 500)).toBe(true);
    });

    it('always allows a credit card at negative balance', () => {
        expect(canDebitFundSource({ isCreditCard: true, balance: -1200 }, 500)).toBe(true);
    });

    it('always allows a credit card at positive balance, even above it', () => {
        expect(canDebitFundSource({ isCreditCard: true, balance: 100 }, 500)).toBe(true);
    });

    it('allows cash at exactly its balance', () => {
        expect(canDebitFundSource({ isCreditCard: false, balance: 500 }, 500)).toBe(true);
    });

    it('refuses cash above its balance', () => {
        expect(canDebitFundSource({ isCreditCard: false, balance: 500 }, 500.01)).toBe(false);
    });

    it('treats a stored string balance as a number', () => {
        expect(canDebitFundSource({ isCreditCard: false, balance: '500' }, 400)).toBe(true);
        expect(canDebitFundSource({ isCreditCard: false, balance: '500' }, 600)).toBe(false);
    });

    it('treats a missing isCreditCard as not a credit card', () => {
        expect(canDebitFundSource({ balance: 10 }, 20)).toBe(false);
    });
});

describe('fundSourceAdjustmentItem', () => {
    it('debit: keyed to the fund source, negative delta, existence + card-or-sufficient condition', () => {
        const item = fundSourceAdjustmentItem(USER, 'BDO', -300);
        expect(item.Update.Key).toEqual({ PK: `USER#${USER}#FundSource`, SK: 'BDO' });
        expect(item.Update.UpdateExpression).toBe('SET balance = balance + :delta');
        expect(item.Update.ExpressionAttributeValues[':delta']).toBe(-300);
        expect(item.Update.ConditionExpression).toBe(
            'attribute_exists(PK) AND (isCreditCard = :true OR balance >= :needed)',
        );
        expect(item.Update.ExpressionAttributeValues[':needed']).toBe(300);
        expect(item.Update.ExpressionAttributeValues[':true']).toBe(true);
    });

    it('credit: positive delta, conditioned only on existence', () => {
        const item = fundSourceAdjustmentItem(USER, 'BDO', 300);
        expect(item.Update.Key).toEqual({ PK: `USER#${USER}#FundSource`, SK: 'BDO' });
        expect(item.Update.ExpressionAttributeValues[':delta']).toBe(300);
        expect(item.Update.ConditionExpression).toBe('attribute_exists(PK)');
        expect(item.Update.ExpressionAttributeValues).not.toHaveProperty(':needed');
        expect(item.Update.ExpressionAttributeValues).not.toHaveProperty(':true');
    });
});
