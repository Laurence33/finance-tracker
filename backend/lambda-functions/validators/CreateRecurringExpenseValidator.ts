import * as z from 'zod/v4';

const lettersAndDashes = /^[a-z0-9-]+$/;

export const CreateRecurringExpenseValidator = z.object({
    name: z.preprocess(
        (value) => (typeof value === 'string' ? value.toLowerCase() : value),
        z.string().regex(lettersAndDashes, { message: 'Name must contain lowercase letters, numbers, and dashes only.' }),
    ),
    displayName: z.string().min(1, 'Display name is required.'),
    amountType: z.enum(['fixed', 'range']),
    amount: z.number().nonnegative().optional().default(0),
    amountMin: z.number().nonnegative().optional().default(0),
    amountMax: z.number().nonnegative().optional().default(0),
    frequency: z.enum(['weekly', 'monthly', 'yearly', 'as_needed']),
    startDate: z.string().optional().default(''),
    endDate: z.string().optional().default(''),
    tags: z.array(z.string()).min(1),
    notes: z.string().optional().default(''),
})
    .refine((data) => {
        if (data.frequency === 'as_needed') return true;
        return data.startDate.length > 0;
    }, { message: 'Start date is required.', path: ['startDate'] })
    .refine((data) => {
        if (data.amountType === 'fixed') return data.amount! > 0;
        return true;
    }, { message: 'Amount is required for fixed type.', path: ['amount'] })
    .refine((data) => {
        if (data.amountType === 'range') return data.amountMin! > 0;
        return true;
    }, { message: 'Minimum amount is required for range type.', path: ['amountMin'] })
    .refine((data) => {
        if (data.amountType === 'range') return data.amountMax! >= data.amountMin!;
        return true;
    }, { message: 'Maximum must be greater than or equal to minimum.', path: ['amountMax'] });

export const UpdateRecurringExpenseValidator = z.object({
    displayName: z.string().min(1, 'Display name is required.'),
    amountType: z.enum(['fixed', 'range']),
    amount: z.number().nonnegative().optional().default(0),
    amountMin: z.number().nonnegative().optional().default(0),
    amountMax: z.number().nonnegative().optional().default(0),
    frequency: z.enum(['weekly', 'monthly', 'yearly', 'as_needed']),
    startDate: z.string().optional().default(''),
    endDate: z.string().optional().default(''),
    tags: z.array(z.string()).min(1),
    notes: z.string().optional().default(''),
});

export const PayRecurringExpenseValidator = z.object({
    periodKey: z.string().min(1, 'Period is required.'),
    amount: z.number().positive('Amount must be greater than 0.'),
    fundSource: z.string().min(1, 'Fund source is required.'),
    notes: z.string().optional().default(''),
});
