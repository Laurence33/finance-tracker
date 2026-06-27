import {
    createBadRequestResponse,
    createSuccessResponse,
    generateValidationErrors,
    HttpStatus,
    isValidDate,
} from 'ft-common-layer';
import { ExpensesService } from 'services/ExpensesService';
import { FundSourcesService } from 'services/FundSourcesService';
import { TagsService } from 'services/TagsService';
import { BudgetService } from 'services/BudgetService';
import { Controller } from 'types/Controller';
import { BadRequestException, NotFoundException } from 'utils/Exceptions';
import { CreateExpenseValidator } from 'validators/CreateExpenseValidator';
import { getFramework } from 'models/frameworkDefinitions';
import { treeifyError } from 'zod/v4';

export class ExpensesController implements Controller {
    private expensesService: ExpensesService;
    private fundSourcesService: FundSourcesService;
    private tagsService: TagsService;
    private budgetService: BudgetService;

    constructor(userId: string) {
        this.expensesService = new ExpensesService(userId);
        this.fundSourcesService = new FundSourcesService(userId);
        this.tagsService = new TagsService(userId);
        this.budgetService = new BudgetService(userId);
    }

    /**
     * Resolves the bucket for an expense against the active framework:
     * - framework off  -> strip the bucket (never persist a stray value)
     * - framework on   -> must be a known bucket (required for POST; optional for PATCH)
     * Returns `{ bucket }` to use, or `{ error }` to reject the request.
     */
    private async resolveBucket(
        bucket: string | undefined,
        required: boolean,
    ): Promise<{ error?: string; bucket?: string }> {
        const config = await this.budgetService.getConfig();
        if (!config.enabled) {
            return { bucket: undefined };
        }
        if (!bucket) {
            return required
                ? { error: 'A bucket is required when a budgeting framework is enabled.' }
                : { bucket: undefined };
        }
        const framework = getFramework(config.framework);
        if (framework && !framework.buckets.some((b) => b.key === bucket)) {
            return { error: `Unknown bucket '${bucket}'.` };
        }
        return { bucket };
    }

    async get(month: string) {
        const expenses = await this.expensesService.getAll(month);
        const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
        return createSuccessResponse(HttpStatus.OK, {
            message: 'Expenses retrieved successfully',
            data: {
                expenses,
                totalExpenses,
            },
        });
    }

    async post(body: any) {
        const validationResult = CreateExpenseValidator.safeParse(body);
        if (!validationResult.success) {
            const errors = treeifyError(validationResult.error).properties;
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Validation failed', errors);
        }

        const checkExpense = await this.expensesService.getExpense(validationResult.data.timestamp);
        if (checkExpense) {
            return createBadRequestResponse(
                HttpStatus.BAD_REQUEST,
                'An expense with the same timestamp already exists.',
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

        const resolved = await this.resolveBucket(validationResult.data.bucket, true);
        if (resolved.error) {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, resolved.error);
        }
        validationResult.data.bucket = resolved.bucket;

        try {
            const expense = await this.expensesService.create(validationResult.data);

            return createSuccessResponse(HttpStatus.OK, {
                message: 'Expense recorded successfully',
                data: expense,
            });
        } catch (error: any) {
            if (error.name === 'TransactionCanceledException') {
                return createBadRequestResponse(
                    HttpStatus.BAD_REQUEST,
                    'Transaction failed. Fund source may have insufficient balance.',
                );
            }
            throw error;
        }
    }

    async patch(timestamp: string, body: any) {
        if (!isValidDate(timestamp)) {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Invalid or missing timestamp');
        }

        const validationResult = CreateExpenseValidator.partial().safeParse(body);
        if (!validationResult.success) {
            const errors = treeifyError(validationResult.error).properties;
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Validation failed', errors);
        }

        if (validationResult.data.fundSource) {
            const fundSource = await this.fundSourcesService.getFundSource(validationResult.data.fundSource);
            if (!fundSource) {
                return createBadRequestResponse(
                    HttpStatus.BAD_REQUEST,
                    'Validation failed',
                    generateValidationErrors({ fundSource: ['Fund source not found.'] }),
                );
            }
        }

        const tags = await this.tagsService.getAll();
        for (const tag of validationResult.data.tags || []) {
            const found = tags.find((dbTag) => dbTag.name === tag);
            if (!found) {
                return createBadRequestResponse(HttpStatus.BAD_REQUEST, `Tag '${tag}' does not exist.`);
            }
        }

        // Validate the bucket only when supplied; only assign a concrete value so a
        // partial update never clobbers an existing bucket with undefined.
        const resolved = await this.resolveBucket(validationResult.data.bucket, false);
        if (resolved.error) {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, resolved.error);
        }
        if (resolved.bucket !== undefined) {
            validationResult.data.bucket = resolved.bucket;
        }

        try {
            const updatedExpense = await this.expensesService.updateExpense(timestamp, validationResult.data);

            return createSuccessResponse(HttpStatus.OK, {
                message: 'Expense updated successfully',
                data: updatedExpense,
            });
        } catch (error: any) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                return createBadRequestResponse(error.statusCode, error.message);
            }
            if (error.name === 'TransactionCanceledException') {
                return createBadRequestResponse(
                    HttpStatus.BAD_REQUEST,
                    'Transaction failed. Fund source may have insufficient balance.',
                );
            }
            throw error;
        }
    }

    async delete(name: string | undefined) {
        if (!name) {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Timestamp is required for deletion.');
        }

        try {
            await this.expensesService.delete(name);
            return createSuccessResponse(HttpStatus.NO_CONTENT);
        } catch (error: any) {
            if (error instanceof NotFoundException) {
                return createBadRequestResponse(HttpStatus.NOT_FOUND, error.message);
            }
            if (error.name === 'TransactionCanceledException') {
                return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Failed to delete expense.');
            }
            throw error;
        }
    }
}
