import { describe, it, expect } from '@jest/globals';
import { validateAllocations } from '../../utils/validateAllocations';
import { JARS_FRAMEWORK } from '../../models/frameworkDefinitions';

describe('validateAllocations (JARS)', () => {
    it('accepts a split that sums exactly to the amount', () => {
        const alloc = { NEC: 55, FFA: 10, LTSS: 10, EDU: 10, PLAY: 10, GIVE: 5 };
        expect(validateAllocations(alloc, 100, JARS_FRAMEWORK).ok).toBe(true);
    });

    it('accepts a sum within a half-cent tolerance', () => {
        const alloc = { NEC: 55.004, FFA: 10, LTSS: 10, EDU: 10, PLAY: 10, GIVE: 5 };
        expect(validateAllocations(alloc, 100, JARS_FRAMEWORK).ok).toBe(true);
    });

    it('rejects when missing/empty', () => {
        expect(validateAllocations(undefined, 100, JARS_FRAMEWORK).ok).toBe(false);
        expect(validateAllocations({}, 100, JARS_FRAMEWORK).ok).toBe(false);
    });

    it('rejects an unknown bucket key', () => {
        const res = validateAllocations({ NEC: 100, BOGUS: 0 }, 100, JARS_FRAMEWORK);
        expect(res.ok).toBe(false);
    });

    it('rejects a negative allocation', () => {
        const res = validateAllocations({ NEC: 110, FFA: -10 }, 100, JARS_FRAMEWORK);
        expect(res.ok).toBe(false);
    });

    it('rejects a sum that does not match the amount', () => {
        const res = validateAllocations({ NEC: 50, FFA: 10 }, 100, JARS_FRAMEWORK);
        expect(res.ok).toBe(false);
    });
});
