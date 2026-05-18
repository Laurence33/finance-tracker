import { createBadRequestResponse, createSuccessResponse, generateValidationErrors, HttpStatus } from 'ft-common-layer';
import { LendingsService } from 'services/LendingsService';
import { FundSourcesService } from 'services/FundSourcesService';
import { Controller } from 'types/Controller';
import { CreateLendingValidator, UpdateLendingValidator, CreateLendingPaymentValidator } from 'validators/CreateLendingValidator';
import { treeifyError } from 'zod/v4';

export class LendingsController implements Controller {
    private lendingsService: LendingsService;
    private fundSourcesService: FundSourcesService;

    constructor(userId: string) {
        this.lendingsService = new LendingsService(userId);
        this.fundSourcesService = new FundSourcesService(userId);
    }

    async get() {
        const lendings = await this.lendingsService.getAll();
        const borrowers = await this.lendingsService.getDistinctBorrowers();
        return createSuccessResponse(HttpStatus.OK, {
            message: 'Lendings retrieved successfully',
            data: {
                lendings,
                borrowers,
            },
        });
    }

    async post(body: any) {
        const validationResult = CreateLendingValidator.safeParse(body);

        if (!validationResult.success) {
            const errors = treeifyError(validationResult.error).properties;
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Validation failed', errors);
        }

        const fundSource = await this.fundSourcesService.getFundSource(validationResult.data.fundSource);
        if (!fundSource) {
            return createBadRequestResponse(
                HttpStatus.BAD_REQUEST,
                'Validation failed',
                generateValidationErrors({ fundSource: ['Fund source not found.'] }),
            );
        }

        if (validationResult.data.deductedFromBalance) {
            const fsItem = fundSource.toNormalItem();
            if (Number(fsItem.balance) < validationResult.data.amount) {
                return createBadRequestResponse(
                    HttpStatus.BAD_REQUEST,
                    'Validation failed',
                    generateValidationErrors({ amount: ['Insufficient fund source balance.'] }),
                );
            }
        }

        try {
            const lending = await this.lendingsService.create(validationResult.data);
            return createSuccessResponse(HttpStatus.OK, {
                message: 'Lending created successfully',
                data: lending,
            });
        } catch (error: any) {
            if (error.name === 'TransactionCanceledException') {
                return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Transaction failed. Fund source may have insufficient balance.');
            }
            throw error;
        }
    }

    async patch(timestamp: string | undefined, body: any) {
        if (!timestamp) {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Lending timestamp is required for update.');
        }

        const validationResult = UpdateLendingValidator.safeParse(body);
        if (!validationResult.success) {
            const errors = treeifyError(validationResult.error).properties;
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Validation failed', errors);
        }

        const existingLending = await this.lendingsService.getLending(timestamp);
        if (!existingLending) {
            return createBadRequestResponse(HttpStatus.NOT_FOUND, 'Lending not found.');
        }

        const updatedLending = await this.lendingsService.update(timestamp, validationResult.data);
        return createSuccessResponse(HttpStatus.OK, {
            message: 'Lending updated successfully',
            data: updatedLending,
        });
    }

    async delete(timestamp: string | undefined) {
        if (!timestamp) {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Lending timestamp is required for deletion.');
        }

        const existingLending = await this.lendingsService.getLending(timestamp);
        if (!existingLending) {
            return createBadRequestResponse(HttpStatus.NOT_FOUND, 'Lending not found.');
        }

        const hasPayments = await this.lendingsService.hasPayments(timestamp);
        if (hasPayments) {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Cannot delete lending that has payments recorded.');
        }

        try {
            await this.lendingsService.delete(timestamp);
            return createSuccessResponse(HttpStatus.NO_CONTENT);
        } catch (error: any) {
            if (error.name === 'TransactionCanceledException') {
                return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Failed to delete lending.');
            }
            throw error;
        }
    }

    async getPayments(lendingTimestamp: string) {
        const payments = await this.lendingsService.getPayments(lendingTimestamp);
        return createSuccessResponse(HttpStatus.OK, {
            message: 'Payments retrieved successfully',
            data: {
                payments,
            },
        });
    }

    async postPayment(body: any) {
        const validationResult = CreateLendingPaymentValidator.safeParse(body);

        if (!validationResult.success) {
            const errors = treeifyError(validationResult.error).properties;
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Validation failed', errors);
        }

        const lending = await this.lendingsService.getLending(validationResult.data.lendingTimestamp);
        if (!lending) {
            return createBadRequestResponse(HttpStatus.NOT_FOUND, 'Lending not found.');
        }

        const lendingItem = lending.toNormalItem();
        if (lendingItem.status === 'paid') {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'This lending is already fully paid.');
        }

        const remaining = lendingItem.amount - lendingItem.totalPaid;
        if (validationResult.data.amount > remaining) {
            return createBadRequestResponse(
                HttpStatus.BAD_REQUEST,
                'Validation failed',
                generateValidationErrors({ amount: [`Payment amount exceeds remaining balance of ${remaining}.`] }),
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

        try {
            const payment = await this.lendingsService.addPayment(
                validationResult.data.lendingTimestamp,
                validationResult.data,
            );
            return createSuccessResponse(HttpStatus.OK, {
                message: 'Payment recorded successfully',
                data: payment,
            });
        } catch (error: any) {
            if (error.name === 'TransactionCanceledException') {
                return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Transaction failed.');
            }
            throw error;
        }
    }
}
