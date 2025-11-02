import { createBadRequestResponse, createSuccessResponse, generateValidationErrors, HttpStatus } from 'ft-common-layer';
import FundSourcesService from 'services/FundSourcesService';
import { Controller } from 'types/Controller';
import { NotFoundException } from 'utils/Exceptions';
import { CreateFundSourceValidator } from 'validators/CreateFundSourceValidator';
import { UpdateFundSourceValidator } from 'validators/UpdateFundSourceValidator';
import { treeifyError } from 'zod/v4';

export class FundSourcesController implements Controller {
    async get() {
        const tags = await FundSourcesService.getAll();
        return createSuccessResponse(HttpStatus.OK, {
            message: 'Expenses retrieved successfully',
            data: {
                tags,
            },
        });
    }

    async post(body: any) {
        const validationResult = CreateFundSourceValidator.safeParse(body);

        if (!validationResult.success) {
            const errors = treeifyError(validationResult.error).properties;
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Validation failed', errors);
        }

        // check duplicate fund source name or displayText
        const fundSources = await FundSourcesService.getAll();
        if (fundSources.length) {
            let hasErrors = false;
            const errors: Record<string, string[]> = {
                name: [],
                displayText: [],
            };
            for (const item of fundSources) {
                if (item.name === validationResult.data.name) {
                    errors.name.push('Name already in use.');
                    hasErrors = true;
                }
                if (item.displayText === validationResult.data.displayText) {
                    errors.displayText.push('Display text already in use.');
                    hasErrors = true;
                }
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

        const fundSource = await FundSourcesService.create(validationResult.data);

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

        try {
            const updatedFundSource = await FundSourcesService.update(name, body);

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

        const fundSourcesInUse = await FundSourcesService.checkInUse(name);
        if (fundSourcesInUse) {
            return createBadRequestResponse(
                HttpStatus.BAD_REQUEST,
                'Cannot delete fund source that is in use by expenses.',
            );
        }

        await FundSourcesService.delete(name);

        return createSuccessResponse(HttpStatus.NO_CONTENT);
    }
}

export default new FundSourcesController();
