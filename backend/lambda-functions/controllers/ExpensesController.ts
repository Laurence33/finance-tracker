import { createBadRequestResponse, createSuccessResponse, HttpStatus, isValidDate } from 'ft-common-layer';
import ExpensesService from 'services/ExpensesService';
import FundSourcesService from 'services/FundSourcesService';
import TagsService from 'services/TagsService';
import { Controller } from 'types/Controller';
import { BadRequestException, NotFoundException } from 'utils/Exceptions';
import { CreateExpenseValidator } from 'validators/CreateExpenseValidator';
import { treeifyError } from 'zod/v4';

export class ExpensesController implements Controller {
    async get(month: string) {
        const expenses = await ExpensesService.getAll(month);
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

        const checkExpense = await ExpensesService.getExpense(validationResult.data.timestamp);
        if (checkExpense) {
            return createBadRequestResponse(
                HttpStatus.BAD_REQUEST,
                'An expense with the same timestamp already exists.',
            );
        }

        const fundSources = await FundSourcesService.getAll();
        const foundFundSource = fundSources.find((fs) => fs.name === validationResult.data.fundSource);
        if (!foundFundSource) {
            return createBadRequestResponse(
                HttpStatus.BAD_REQUEST,
                `Fund source '${validationResult.data.fundSource}' does not exist.`,
            );
        }

        const tags = await TagsService.getAll();
        for (const tag of validationResult.data.tags) {
            const found = tags.find((dbTag) => dbTag.name === tag);
            if (!found) {
                return createBadRequestResponse(HttpStatus.BAD_REQUEST, `Tag '${tag}' does not exist.`);
            }
        }

        const expense = await ExpensesService.create(body);

        return createSuccessResponse(HttpStatus.OK, {
            message: 'Expense recorded successfully',
            data: expense,
        });
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

        const tags = await TagsService.getAll();
        // validationResult.data always have 1+ tag when defined because of zod validation
        for (const tag of validationResult.data.tags || []) {
            const found = tags.find((dbTag) => dbTag.name === tag);
            if (!found) {
                return createBadRequestResponse(HttpStatus.BAD_REQUEST, `Tag '${tag}' does not exist.`);
            }
        }
        try {
            const updatedExpense = await ExpensesService.updateExpense(timestamp, validationResult.data);

            return createSuccessResponse(HttpStatus.OK, {
                message: 'Expense updated successfully',
                data: updatedExpense,
            });
        } catch (error: any) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                return createBadRequestResponse(error.statusCode, error.message);
            }
            throw error;
        }
    }

    async delete(name: string | undefined) {
        if (!name) {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Timestamp is required for deletion.');
        }

        await ExpensesService.delete(name);
        return createSuccessResponse(HttpStatus.NO_CONTENT);
    }
}

export default new ExpensesController();
