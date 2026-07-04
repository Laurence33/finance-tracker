const CENT = 0.005; // half-a-cent tolerance for floating point sums

export type AllocationValidationResult = { ok: true } | { ok: false; message: string };

/**
 * Validates an income allocation map against the user's seeded buckets:
 * - every key is a known bucket
 * - every value is a non-negative number
 * - the values sum (within a cent) to the income amount
 */
export function validateAllocations(
    allocations: Record<string, number> | undefined,
    amount: number,
    bucketKeys: string[],
    bucketLabel: string = 'bucket',
): AllocationValidationResult {
    if (!allocations || Object.keys(allocations).length === 0) {
        return { ok: false, message: 'Allocations are required when a budgeting framework is enabled.' };
    }

    const validKeys = new Set(bucketKeys);
    let sum = 0;
    for (const [key, value] of Object.entries(allocations)) {
        if (!validKeys.has(key)) {
            return { ok: false, message: `Unknown ${bucketLabel.toLowerCase()} '${key}'.` };
        }
        if (typeof value !== 'number' || isNaN(value) || value < 0) {
            return { ok: false, message: `Invalid allocation for '${key}'.` };
        }
        sum += value;
    }

    if (Math.abs(sum - amount) > CENT) {
        return {
            ok: false,
            message: `Allocations (${sum.toFixed(2)}) must add up to the income amount (${amount.toFixed(2)}).`,
        };
    }

    return { ok: true };
}
