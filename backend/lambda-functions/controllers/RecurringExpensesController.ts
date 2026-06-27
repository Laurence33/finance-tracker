import { createBadRequestResponse, createSuccessResponse, generateValidationErrors, HttpStatus } from 'ft-common-layer';
import { RecurringExpensesService } from 'services/RecurringExpensesService';
import { FundSourcesService } from 'services/FundSourcesService';
import { TagsService } from 'services/TagsService';
import { Controller } from 'types/Controller';
import { CreateRecurringExpenseValidator, UpdateRecurringExpenseValidator, PayRecurringExpenseValidator } from 'validators/CreateRecurringExpenseValidator';
import { treeifyError } from 'zod/v4';

export class RecurringExpensesController implements Controller {
    private recurringExpensesService: RecurringExpensesService;
    private fundSourcesService: FundSourcesService;
    private tagsService: TagsService;

    constructor(userId: string) {
        this.recurringExpensesService = new RecurringExpensesService(userId);
        this.fundSourcesService = new FundSourcesService(userId);
        this.tagsService = new TagsService(userId);
    }

    async get() {
        const recurringExpenses = await this.recurringExpensesService.getAll();
        return createSuccessResponse(HttpStatus.OK, {
            message: 'Recurring expenses retrieved successfully',
            data: { recurringExpenses },
        });
    }

    async post(body: any) {
        const validationResult = CreateRecurringExpenseValidator.safeParse(body);
        if (!validationResult.success) {
            const errors = treeifyError(validationResult.error).properties;
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Validation failed', errors);
        }

        const existing = await this.recurringExpensesService.getRecurringExpense(validationResult.data.name);
        if (existing) {
            return createBadRequestResponse(
                HttpStatus.BAD_REQUEST,
                'Validation failed',
                generateValidationErrors({ name: ['Identifier already in use.'] }),
            );
        }

        const tags = await this.tagsService.getAll();
        for (const tag of validationResult.data.tags) {
            if (!tags.find((t) => t.name === tag)) {
                return createBadRequestResponse(HttpStatus.BAD_REQUEST, `Tag '${tag}' does not exist.`);
            }
        }

        const recurring = await this.recurringExpensesService.create(validationResult.data);
        return createSuccessResponse(HttpStatus.OK, {
            message: 'Recurring expense created successfully',
            data: recurring,
        });
    }

    async patch(name: string | undefined, body: any) {
        if (!name) {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Name is required for update.');
        }

        const validationResult = UpdateRecurringExpenseValidator.safeParse(body);
        if (!validationResult.success) {
            const errors = treeifyError(validationResult.error).properties;
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Validation failed', errors);
        }

        const existing = await this.recurringExpensesService.getRecurringExpense(name);
        if (!existing) {
            return createBadRequestResponse(HttpStatus.NOT_FOUND, 'Recurring expense not found.');
        }

        const updated = await this.recurringExpensesService.update(name, validationResult.data);
        return createSuccessResponse(HttpStatus.OK, {
            message: 'Recurring expense updated successfully',
            data: updated,
        });
    }

    async delete(name: string | undefined) {
        if (!name) {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Name is required for deletion.');
        }

        const existing = await this.recurringExpensesService.getRecurringExpense(name);
        if (!existing) {
            return createBadRequestResponse(HttpStatus.NOT_FOUND, 'Recurring expense not found.');
        }

        const hasPayments = await this.recurringExpensesService.hasPayments(name);
        if (hasPayments) {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Cannot delete recurring expense that has payment records.');
        }

        await this.recurringExpensesService.delete(name);
        return createSuccessResponse(HttpStatus.NO_CONTENT);
    }

    async getPayments(name: string) {
        const payments = await this.recurringExpensesService.getPayments(name);
        return createSuccessResponse(HttpStatus.OK, {
            message: 'Payments retrieved successfully',
            data: { payments },
        });
    }

    async pay(name: string, body: any) {
        const validationResult = PayRecurringExpenseValidator.safeParse(body);
        if (!validationResult.success) {
            const errors = treeifyError(validationResult.error).properties;
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Validation failed', errors);
        }

        const recurring = await this.recurringExpensesService.getRecurringExpense(name);
        if (!recurring) {
            return createBadRequestResponse(HttpStatus.NOT_FOUND, 'Recurring expense not found.');
        }

        const recurringItem = recurring.toNormalItem();
        if (recurringItem.status !== 'active') {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Cannot pay for a recurring expense that is not active.');
        }

        // Check period not already paid (skip for as_needed — allows multiple payments)
        if (recurringItem.frequency !== 'as_needed') {
            const existingPayment = await this.recurringExpensesService.getPayment(name, validationResult.data.periodKey);
            if (existingPayment) {
                return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'This period has already been paid.');
            }
        }

        const fundSource = await this.fundSourcesService.getFundSource(validationResult.data.fundSource);
        if (!fundSource) {
            return createBadRequestResponse(
                HttpStatus.BAD_REQUEST,
                'Validation failed',
                generateValidationErrors({ fundSource: ['Fund source not found.'] }),
            );
        }

        try {
            const payment = await this.recurringExpensesService.pay(name, validationResult.data, recurringItem);
            return createSuccessResponse(HttpStatus.OK, {
                message: 'Payment recorded successfully',
                data: payment,
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

    async updateStatus(name: string | undefined, body: any) {
        if (!name) {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Name is required.');
        }

        const status = body.status;
        if (!['active', 'completed', 'cancelled'].includes(status)) {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Invalid status. Must be active, completed, or cancelled.');
        }

        const existing = await this.recurringExpensesService.getRecurringExpense(name);
        if (!existing) {
            return createBadRequestResponse(HttpStatus.NOT_FOUND, 'Recurring expense not found.');
        }

        await this.recurringExpensesService.updateStatus(name, status);
        return createSuccessResponse(HttpStatus.OK, {
            message: `Recurring expense ${status} successfully`,
        });
    }
}
