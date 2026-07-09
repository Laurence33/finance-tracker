import * as z from 'zod/v4';

export const CreateAssetValidator = z.object({
    name: z.string().min(1, 'Asset name is required.'),
    value: z.number().positive('Value must be greater than 0.'),
    category: z.string().optional().default(''),
    notes: z.string().optional().default(''),
    // Optional fund source to deduct the asset's value from at creation time.
    // No expense record is written; this is a one-time cash-to-asset transfer.
    fundSource: z.string().optional().default(''),
});

export const UpdateAssetValidator = z.object({
    name: z.string().min(1, 'Asset name is required.'),
    value: z.number().positive('Value must be greater than 0.'),
    category: z.string().optional().default(''),
    notes: z.string().optional().default(''),
});
