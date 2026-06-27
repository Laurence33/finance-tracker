import * as z from 'zod/v4';

export const CreateAssetValidator = z.object({
    name: z.string().min(1, 'Asset name is required.'),
    value: z.number().positive('Value must be greater than 0.'),
    category: z.string().optional().default(''),
    notes: z.string().optional().default(''),
});

export const UpdateAssetValidator = z.object({
    name: z.string().min(1, 'Asset name is required.'),
    value: z.number().positive('Value must be greater than 0.'),
    category: z.string().optional().default(''),
    notes: z.string().optional().default(''),
});
