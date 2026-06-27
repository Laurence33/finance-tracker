import * as z from 'zod/v4';

export const UpdateFundSourceValidator = z.object({
    balance: z.number(),
    displayText: z.string(),
    icon: z.string().optional(),
    isCreditCard: z.boolean().optional(),
});
