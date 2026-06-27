import { createBadRequestResponse, createSuccessResponse, generateValidationErrors, HttpStatus } from 'ft-common-layer';
import { FundSourcesService } from 'services/FundSourcesService';
import { Controller } from 'types/Controller';
import { NotFoundException } from 'utils/Exceptions';
import { CreateFundSourceValidator } from 'validators/CreateFundSourceValidator';
import { UpdateFundSourceValidator } from 'validators/UpdateFundSourceValidator';
import { treeifyError } from 'zod/v4';

export class FundSourcesController implements Controller {
    private fundSourcesService: FundSourcesService;

    constructor(userId: string) {
        this.fundSourcesService = new FundSourcesService(userId);
    }

    async get() {
        const fundSources = await this.fundSourcesService.getAll();
        return createSuccessResponse(HttpStatus.OK, {
            message: 'Fund sources retrieved successfully',
            data: {
                fundSources,
            },
        });
    }

    async post(body: any) {
        const validationResult = CreateFundSourceValidator.safeParse(body);

        if (!validationResult.success) {
            const errors = treeifyError(validationResult.error).properties;
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Validation failed', errors);
        }

        const existingFundSource = (await this.fundSourcesService.getFundSource(validationResult.data.name))?.toNormalItem();
        if (existingFundSource) {
            let hasErrors = false;
            const errors: Record<string, string[]> = {
                name: [],
                displayText: [],
            };
            if (existingFundSource.name === validationResult.data.name) {
                errors.name.push('Identifier already in use.');
                hasErrors = true;
            }
            if (existingFundSource.displayText === validationResult.data.displayText) {
                errors.displayText.push('Display text already in use.');
                hasErrors = true;
            }

            if (hasErrors) {
                console.log('Validation errors:', errors);
                return createBadRequestResponse(
                    HttpStatus.BAD_REQUEST,
                    'Validation failed',
                    generateValidationErrors(errors),
                );
            }
        }

        const fundSource = await this.fundSourcesService.create(validationResult.data);

        return createSuccessResponse(HttpStatus.OK, {
            message: 'Fund Source recorded successfully',
            data: fundSource,
        });
    }

    async patch(name: string | undefined, body: any) {
        if (!name) {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Fund source name is required for update.');
        }

        const validationResult = UpdateFundSourceValidator.partial().safeParse(body);
        if (!validationResult.success) {
            const errors = treeifyError(validationResult.error).properties;
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Validation failed', errors);
        }

        const existingFundSource = (await this.fundSourcesService.getFundSource(name))?.toNormalItem();
        if (!existingFundSource) {
            return createBadRequestResponse(HttpStatus.NOT_FOUND, 'Fund source not found.');
        }

        const nextIsCreditCard = validationResult.data.isCreditCard ?? existingFundSource.isCreditCard;
        const nextBalance = Number(validationResult.data.balance ?? existingFundSource.balance);
        if (!nextIsCreditCard && nextBalance < 0) {
            return createBadRequestResponse(
                HttpStatus.BAD_REQUEST,
                'Validation failed',
                generateValidationErrors({
                    balance: ['Only credit cards can have a negative balance.'],
                }),
            );
        }

        try {
            const updatedFundSource = await this.fundSourcesService.update(name, body);

            return createSuccessResponse(HttpStatus.OK, {
                message: 'Fund Source updated successfully',
                data: updatedFundSource,
            });
        } catch (error) {
            if (error instanceof NotFoundException) {
                return createBadRequestResponse(HttpStatus.NOT_FOUND, error.message);
            }
            throw error;
        }
    }

    async delete(name: string | undefined) {
        if (!name) {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Fund source name is required for deletion.');
        }

        const fundSourcesInUse = await this.fundSourcesService.checkInUse(name);
        if (fundSourcesInUse) {
            return createBadRequestResponse(
                HttpStatus.BAD_REQUEST,
                'Cannot delete fund source that is in use by expenses.',
            );
        }

        await this.fundSourcesService.delete(name);

        return createSuccessResponse(HttpStatus.NO_CONTENT);
    }
}
