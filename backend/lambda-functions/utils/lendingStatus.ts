export type LendingStatus = 'active' | 'partially_paid' | 'paid';

// A Lending is paid once repayments reach its amount, partially paid while
// some (but not all) is repaid, and active until anything is repaid.
export function lendingStatus(amount: number, totalPaid: number): LendingStatus {
    if (totalPaid >= amount) return 'paid';
    if (totalPaid > 0) return 'partially_paid';
    return 'active';
}

type EditableLending = { amount: number; totalPaid: number; deductedFromBalance: boolean };

export type LendingEditPlan =
    | { ok: false; totalPaid: number }
    | { ok: true; balanceDelta: number; status: LendingStatus };

// Decides what editing a Lending's amount does. Refused below what's already
// repaid. balanceDelta is what to give back to (positive) or take from
// (negative) the Fund Source — zero when the Lending was reference-only.
export function planLendingEdit(existing: EditableLending, newAmount: number): LendingEditPlan {
    if (newAmount < existing.totalPaid) {
        return { ok: false, totalPaid: existing.totalPaid };
    }
    const balanceDelta = existing.deductedFromBalance ? existing.amount - newAmount : 0;
    return { ok: true, balanceDelta, status: lendingStatus(newAmount, existing.totalPaid) };
}
