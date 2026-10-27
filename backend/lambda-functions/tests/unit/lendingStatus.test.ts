import { describe, it, expect } from '@jest/globals';
import { lendingStatus, planLendingEdit } from '../../utils/lendingStatus';

describe('lendingStatus', () => {
    it('is active when nothing is repaid', () => {
        expect(lendingStatus(5000, 0)).toBe('active');
    });

    it('is partially paid while repayments fall short', () => {
        expect(lendingStatus(5000, 1000)).toBe('partially_paid');
    });

    it('is paid once repayments reach the amount', () => {
        expect(lendingStatus(5000, 5000)).toBe('paid');
    });
});

describe('planLendingEdit', () => {
    const deducted = { amount: 5000, totalPaid: 0, deductedFromBalance: true };
    const referenceOnly = { amount: 5000, totalPaid: 0, deductedFromBalance: false };

    it('deducted, decrease: gives the difference back to the fund source', () => {
        expect(planLendingEdit(deducted, 3000)).toEqual({ ok: true, balanceDelta: 2000, status: 'active' });
    });

    it('deducted, increase: takes the extra from the fund source', () => {
        expect(planLendingEdit(deducted, 8000)).toEqual({ ok: true, balanceDelta: -3000, status: 'active' });
    });

    it('deducted, unchanged: touches no balance', () => {
        expect(planLendingEdit(deducted, 5000)).toEqual({ ok: true, balanceDelta: 0, status: 'active' });
    });

    it('reference-only, decrease: touches no balance', () => {
        expect(planLendingEdit(referenceOnly, 3000)).toEqual({ ok: true, balanceDelta: 0, status: 'active' });
    });

    it('reference-only, increase: touches no balance', () => {
        expect(planLendingEdit(referenceOnly, 8000)).toEqual({ ok: true, balanceDelta: 0, status: 'active' });
    });

    it('refuses an amount below the total repaid, naming it', () => {
        const lending = { amount: 5000, totalPaid: 2000, deductedFromBalance: true };
        expect(planLendingEdit(lending, 1999)).toEqual({ ok: false, totalPaid: 2000 });
    });

    it('edit down to exactly the repaid total becomes paid', () => {
        const lending = { amount: 5000, totalPaid: 2000, deductedFromBalance: true };
        expect(planLendingEdit(lending, 2000)).toEqual({ ok: true, balanceDelta: 3000, status: 'paid' });
    });

    it('a paid lending edited upward becomes partially paid', () => {
        const lending = { amount: 5000, totalPaid: 5000, deductedFromBalance: true };
        expect(planLendingEdit(lending, 6000)).toEqual({ ok: true, balanceDelta: -1000, status: 'partially_paid' });
    });

    it('a partially paid lending edited but still short stays partially paid', () => {
        const lending = { amount: 5000, totalPaid: 2000, deductedFromBalance: false };
        expect(planLendingEdit(lending, 4000)).toEqual({ ok: true, balanceDelta: 0, status: 'partially_paid' });
    });
});
