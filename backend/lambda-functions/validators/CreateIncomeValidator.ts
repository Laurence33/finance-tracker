import * as z from 'zod/v4';

export const CreateIncomeValidator = z.object({
    timestamp: z
        .string()
        .transform((value) => new Date(value))
        .refine((date) => !isNaN(date.getTime()), {
            message: 'Invalid date format',
        })
        .transform((date) => date.toISOString().replace('Z', '').replace('T', ' ')),
    amount: z.number().positive(),
    fundSource: z.string(),
    source: z.string().min(1, 'Source is required.'),
    tags: z.array(z.string()).min(1),
    notes: z.string().optional().default(''),
});
