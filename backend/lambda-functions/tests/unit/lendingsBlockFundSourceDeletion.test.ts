import { describe, it, expect } from '@jest/globals';
import { lendingsBlockFundSourceDeletion } from '../../utils/lendingsBlockFundSourceDeletion';

describe('lendingsBlockFundSourceDeletion', () => {
    it('blocks when an active lending was drawn from the fund source', () => {
        const lendings = [{ fundSource: 'BPI', status: 'active' }];
        expect(lendingsBlockFundSourceDeletion(lendings, 'BPI')).toBe(true);
    });

    it('blocks when a partially paid lending was drawn from the fund source', () => {
        const lendings = [{ fundSource: 'BPI', status: 'partially_paid' }];
        expect(lendingsBlockFundSourceDeletion(lendings, 'BPI')).toBe(true);
    });

    it('does not block when only paid lendings reference the fund source', () => {
        const lendings = [
            { fundSource: 'BPI', status: 'paid' },
            { fundSource: 'BPI', status: 'paid' },
        ];
        expect(lendingsBlockFundSourceDeletion(lendings, 'BPI')).toBe(false);
    });

    it('ignores unpaid lendings drawn from other fund sources', () => {
        const lendings = [
            { fundSource: 'GCASH', status: 'active' },
            { fundSource: 'BPI', status: 'paid' },
        ];
        expect(lendingsBlockFundSourceDeletion(lendings, 'BPI')).toBe(false);
    });

    it('does not block when there are no lendings', () => {
        expect(lendingsBlockFundSourceDeletion([], 'BPI')).toBe(false);
    });
});
