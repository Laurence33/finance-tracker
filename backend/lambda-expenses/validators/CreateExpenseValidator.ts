/* eslint-disable prettier/prettier */
import * as z from 'zod/v4';

export const CreateExpenseValidator = z.object({
  timestamp: z
    .string()
    .transform((value) => new Date(value))
    .refine((date) => !isNaN(date.getTime()), {
      message: 'Invalid date format',
    })
    .transform((date) => date.toISOString().replace('Z', '').replace('T', ' ')),
  amount: z.number().positive(),
  fundSource: z.string(), // TODO: check against a list of allowed fund sources later
});