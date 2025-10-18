import * as z from 'zod/v4';

export const UpdateFundSourceValidator = z.object({
    balance: z.number().nonnegative(),
    displayText: z.string(),
});
