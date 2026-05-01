import * as z from 'zod/v4';

const lettersAndDashes = /^[a-zA-Z0-9-]+$/;

export const CreateTagValidator = z.object({
    name: z.preprocess(
        (value) => (typeof value === 'string' ? value.toLowerCase() : value),
        z.string()
            .min(1, { message: 'Tag name is required.' })
            .max(50, { message: 'Tag name must be 50 characters or less.' })
            .regex(lettersAndDashes, { message: 'Tag name must contain only letters, numbers, and dashes.' }),
    ),
    budget: z.number().min(0, { message: 'Budget must be 0 or greater.' }).optional().default(0),
});

export const UpdateTagValidator = z.object({
    name: z.preprocess(
        (value) => (typeof value === 'string' ? value.toLowerCase() : value),
        z.string()
            .min(1, { message: 'Tag name is required.' })
            .max(50, { message: 'Tag name must be 50 characters or less.' })
            .regex(lettersAndDashes, { message: 'Tag name must contain only letters, numbers, and dashes.' }),
    ),
    budget: z.number().min(0, { message: 'Budget must be 0 or greater.' }).optional().default(0),
});
