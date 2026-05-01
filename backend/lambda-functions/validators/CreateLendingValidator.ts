import * as z from 'zod/v4';

export const CreateLendingValidator = z.object({
    borrower: z.string().min(1, 'Borrower name is required.'),
    amount: z.number().positive('Amount must be greater than 0.'),
    fundSource: z.string().min(1, 'Fund source is required.'),
    promisedDate: z.string().min(1, 'Promised payment date is required.'),
    notes: z.string().optional().default(''),
});

export const UpdateLendingValidator = z.object({
    borrower: z.string().min(1, 'Borrower name is required.'),
    amount: z.number().positive('Amount must be greater than 0.'),
    promisedDate: z.string().min(1, 'Promised payment date is required.'),
    notes: z.string().optional().default(''),
});

export const CreateLendingPaymentValidator = z.object({
    lendingTimestamp: z.string().min(1, 'Lending reference is required.'),
    amount: z.number().positive('Amount must be greater than 0.'),
    fundSource: z.string().min(1, 'Fund source is required.'),
    notes: z.string().optional().default(''),
});
