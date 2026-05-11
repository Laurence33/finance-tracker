import { createBadRequestResponse, createSuccessResponse, generateValidationErrors, HttpStatus } from 'ft-common-layer';
import { TransfersService } from 'services/TransfersService';
import { FundSourcesService } from 'services/FundSourcesService';
import { Controller } from 'types/Controller';
import { CreateTransferValidator } from 'validators/CreateTransferValidator';
import { treeifyError } from 'zod/v4';

export class TransfersController implements Controller {
    private transfersService: TransfersService;
    private fundSourcesService: FundSourcesService;

    constructor(userId: string) {
        this.transfersService = new TransfersService(userId);
        this.fundSourcesService = new FundSourcesService(userId);
    }

    async get() {
        const transfers = await this.transfersService.getAll();
        return createSuccessResponse(HttpStatus.OK, {
            message: 'Transfers retrieved successfully',
            data: { transfers },
        });
    }

    async post(body: any) {
        const validationResult = CreateTransferValidator.safeParse(body);
        if (!validationResult.success) {
            const errors = treeifyError(validationResult.error).properties;
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Validation failed', errors);
        }

        const data = validationResult.data;

        const sourceFund = await this.fundSourcesService.getFundSource(data.sourceFundSource);
        if (!sourceFund) {
            return createBadRequestResponse(
                HttpStatus.BAD_REQUEST,
                'Validation failed',
                generateValidationErrors({ sourceFundSource: ['Source fund source not found.'] }),
            );
        }

        const destFund = await this.fundSourcesService.getFundSource(data.destinationFundSource);
        if (!destFund) {
            return createBadRequestResponse(
                HttpStatus.BAD_REQUEST,
                'Validation failed',
                generateValidationErrors({ destinationFundSource: ['Destination fund source not found.'] }),
            );
        }

        const totalDeducted = data.amount + data.fee;
        const sourceBalance = Number(sourceFund.toNormalItem().balance);
        if (sourceBalance < totalDeducted) {
            return createBadRequestResponse(
                HttpStatus.BAD_REQUEST,
                'Validation failed',
                generateValidationErrors({ amount: ['Insufficient source fund balance.'] }),
            );
        }

        try {
            const transfer = await this.transfersService.create(data);
            return createSuccessResponse(HttpStatus.OK, {
                message: 'Transfer completed successfully',
                data: transfer,
            });
        } catch (error: any) {
            if (error.name === 'TransactionCanceledException') {
                return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Transfer failed. Please try again.');
            }
            throw error;
        }
    }
}
