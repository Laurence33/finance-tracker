import { createBadRequestResponse, createSuccessResponse, generateValidationErrors, HttpStatus, isValidDate } from 'ft-common-layer';
import { IncomesService } from 'services/IncomesService';
import { FundSourcesService } from 'services/FundSourcesService';
import { TagsService } from 'services/TagsService';
import { BudgetService } from 'services/BudgetService';
import { Controller } from 'types/Controller';
import { BadRequestException, NotFoundException } from 'utils/Exceptions';
import { CreateIncomeValidator } from 'validators/CreateIncomeValidator';
import { validateAllocations } from 'utils/validateAllocations';
import { treeifyError } from 'zod/v4';

export class IncomesController implements Controller {
    private incomesService: IncomesService;
    private fundSourcesService: FundSourcesService;
    private tagsService: TagsService;
    private budgetService: BudgetService;

    constructor(userId: string) {
        this.incomesService = new IncomesService(userId);
        this.fundSourcesService = new FundSourcesService(userId);
        this.tagsService = new TagsService(userId);
        this.budgetService = new BudgetService(userId);
    }

    async get(month: string) {
        const incomes = await this.incomesService.getAll(month);
        const totalIncome = incomes.reduce((sum, income) => sum + Number(income.amount), 0) || 0;
        return createSuccessResponse(HttpStatus.OK, {
            message: 'Incomes retrieved successfully',
            data: {
                incomes,
                totalIncome,
            },
        });
    }

    async post(body: any) {
        const validationResult = CreateIncomeValidator.safeParse(body);
        if (!validationResult.success) {
            const errors = treeifyError(validationResult.error).properties;
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Validation failed', errors);
        }

        const checkIncome = await this.incomesService.getIncome(validationResult.data.timestamp);
        if (checkIncome) {
            return createBadRequestResponse(
                HttpStatus.BAD_REQUEST,
                'An income with the same timestamp already exists.',
            );
        }

        const fundSource = await this.fundSourcesService.getFundSource(validationResult.data.fundSource);
        if (!fundSource) {
            return createBadRequestResponse(
                HttpStatus.BAD_REQUEST,
                'Validation failed',
                generateValidationErrors({ fundSource: ['Fund source not found.'] }),
            );
        }

        const tags = await this.tagsService.getAll();
        for (const tag of validationResult.data.tags) {
            const found = tags.find((dbTag) => dbTag.name === tag);
            if (!found) {
                return createBadRequestResponse(HttpStatus.BAD_REQUEST, `Tag '${tag}' does not exist.`);
            }
        }

        const config = await this.budgetService.getConfig();
        if (config.enabled) {
            // Validate against the user's seeded buckets — the runtime truth for keys.
            const buckets = await this.budgetService.getBuckets();
            if (buckets.length > 0) {
                const result = validateAllocations(
                    validationResult.data.allocations,
                    validationResult.data.amount,
                    buckets.map((b) => b.key),
                );
                if (!result.ok) {
                    return createBadRequestResponse(HttpStatus.BAD_REQUEST, result.message);
                }
            }
        } else {
            // No framework active — never persist stray allocations.
            validationResult.data.allocations = undefined;
        }

        try {
            const income = await this.incomesService.create(validationResult.data);

            return createSuccessResponse(HttpStatus.OK, {
                message: 'Income recorded successfully',
                data: income,
            });
        } catch (error: any) {
            if (error.name === 'TransactionCanceledException') {
                return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Transaction failed.');
            }
            throw error;
        }
    }

    async patch(timestamp: string, body: any) {
        if (!isValidDate(timestamp)) {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Invalid or missing timestamp');
        }

        const validationResult = CreateIncomeValidator.partial().safeParse(body);
        if (!validationResult.success) {
            const errors = treeifyError(validationResult.error).properties;
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Validation failed', errors);
        }

        const tags = await this.tagsService.getAll();
        for (const tag of validationResult.data.tags || []) {
            const found = tags.find((dbTag) => dbTag.name === tag);
            if (!found) {
                return createBadRequestResponse(HttpStatus.BAD_REQUEST, `Tag '${tag}' does not exist.`);
            }
        }

        // Validate a re-allocation only when one is supplied and a framework is active.
        if (validationResult.data.allocations !== undefined) {
            const config = await this.budgetService.getConfig();
            const buckets = config.enabled ? await this.budgetService.getBuckets() : [];
            if (buckets.length > 0) {
                let amount = validationResult.data.amount;
                if (amount === undefined) {
                    const existing = await this.incomesService.getIncome(timestamp);
                    amount = existing ? existing.toNormalItem().amount : 0;
                }
                const result = validateAllocations(
                    validationResult.data.allocations,
                    amount,
                    buckets.map((b) => b.key),
                );
                if (!result.ok) {
                    return createBadRequestResponse(HttpStatus.BAD_REQUEST, result.message);
                }
            }
        }

        try {
            const updatedIncome = await this.incomesService.updateIncome(timestamp, validationResult.data);

            return createSuccessResponse(HttpStatus.OK, {
                message: 'Income updated successfully',
                data: updatedIncome,
            });
        } catch (error: any) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                return createBadRequestResponse(error.statusCode, error.message);
            }
            if (error.name === 'TransactionCanceledException') {
                return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Transaction failed. Fund source may have insufficient balance.');
            }
            throw error;
        }
    }

    async delete(timestamp: string | undefined) {
        if (!timestamp) {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Timestamp is required for deletion.');
        }

        try {
            await this.incomesService.delete(timestamp);
            return createSuccessResponse(HttpStatus.NO_CONTENT);
        } catch (error: any) {
            if (error instanceof NotFoundException) {
                return createBadRequestResponse(HttpStatus.NOT_FOUND, error.message);
            }
            if (error.name === 'TransactionCanceledException') {
                return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Failed to delete income. Fund source may have insufficient balance.');
            }
            throw error;
        }
    }
}
