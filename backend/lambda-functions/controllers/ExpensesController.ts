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
import { Controller } from 'types/Controller';
import { BadRequestException, NotFoundException } from 'utils/Exceptions';
import { CreateExpenseValidator } from 'validators/CreateExpenseValidator';
import { treeifyError } from 'zod/v4';

export class ExpensesController implements Controller {
    private expensesService: ExpensesService;
    private fundSourcesService: FundSourcesService;
    private tagsService: TagsService;

    constructor(userId: string) {
        this.expensesService = new ExpensesService(userId);
        this.fundSourcesService = new FundSourcesService(userId);
        this.tagsService = new TagsService(userId);
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

        const tags = await this.tagsService.getAll();
        for (const tag of validationResult.data.tags || []) {
            const found = tags.find((dbTag) => dbTag.name === tag);
            if (!found) {
                return createBadRequestResponse(HttpStatus.BAD_REQUEST, `Tag '${tag}' does not exist.`);
            }
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
