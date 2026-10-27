type LendingRef = { fundSource: string; status: string };

// A Fund Source can't be deleted while any unpaid Lending was drawn from it,
// otherwise that Lending's deduction could not be returned on delete or repayment.
// Paid Lendings have nothing left to refund, so they never block.
export function lendingsBlockFundSourceDeletion(lendings: LendingRef[], fundSourceName: string): boolean {
    return lendings.some((lending) => lending.fundSource === fundSourceName && lending.status !== 'paid');
}
