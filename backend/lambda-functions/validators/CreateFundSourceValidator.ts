import * as z from 'zod/v4';

const lettersAndDashes = /^[A-Za-z0-9-]+$/;

export const CreateFundSourceValidator = z
    .object({
        name: z.preprocess(
            (value) => (typeof value === 'string' ? value.toLowerCase() : value),
            z.string().regex(lettersAndDashes, { message: 'Name must contain letters and dashes only.' }),
        ),
        balance: z.number(),
        displayText: z.string(),
        icon: z.string().optional().default('wallet'),
        isCreditCard: z.boolean().optional().default(false),
    })
    .refine((data) => data.isCreditCard || data.balance >= 0, {
        message: 'Balance cannot be negative.',
        path: ['balance'],
    });
