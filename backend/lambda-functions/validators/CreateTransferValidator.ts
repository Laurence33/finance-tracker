import * as z from 'zod/v4';

export const CreateTransferValidator = z
    .object({
        timestamp: z
            .string()
            .transform((value) => new Date(value))
            .refine((date) => !isNaN(date.getTime()), {
                message: 'Invalid date format',
            })
            .transform((date) => date.toISOString().replace('Z', '').replace('T', ' ')),
        sourceFundSource: z.string().min(1, 'Source fund source is required.'),
        destinationFundSource: z.string().min(1, 'Destination fund source is required.'),
        amount: z.number().positive(),
        fee: z.number().nonnegative().optional().default(0),
        note: z.string().optional().default(''),
    })
    .refine((data) => data.sourceFundSource !== data.destinationFundSource, {
        message: 'Source and destination must differ.',
        path: ['destinationFundSource'],
    });
