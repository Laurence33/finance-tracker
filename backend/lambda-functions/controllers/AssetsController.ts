import { createBadRequestResponse, createSuccessResponse, HttpStatus } from 'ft-common-layer';
import { AssetsService } from 'services/AssetsService';
import { Controller } from 'types/Controller';
import { CreateAssetValidator, UpdateAssetValidator } from 'validators/CreateAssetValidator';
import { treeifyError } from 'zod/v4';

export class AssetsController implements Controller {
    private assetsService: AssetsService;

    constructor(userId: string) {
        this.assetsService = new AssetsService(userId);
    }

    async get() {
        const assets = await this.assetsService.getAll();
        return createSuccessResponse(HttpStatus.OK, {
            message: 'Assets retrieved successfully',
            data: {
                assets,
            },
        });
    }

    async post(body: any) {
        const validationResult = CreateAssetValidator.safeParse(body);

        if (!validationResult.success) {
            const errors = treeifyError(validationResult.error).properties;
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Validation failed', errors);
        }

        const asset = await this.assetsService.create(validationResult.data);
        return createSuccessResponse(HttpStatus.OK, {
            message: 'Asset created successfully',
            data: asset,
        });
    }

    async patch(timestamp: string | undefined, body: any) {
        if (!timestamp) {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Asset timestamp is required for update.');
        }

        const validationResult = UpdateAssetValidator.safeParse(body);
        if (!validationResult.success) {
            const errors = treeifyError(validationResult.error).properties;
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Validation failed', errors);
        }

        const existingAsset = await this.assetsService.getAsset(timestamp);
        if (!existingAsset) {
            return createBadRequestResponse(HttpStatus.NOT_FOUND, 'Asset not found.');
        }

        const updatedAsset = await this.assetsService.update(timestamp, validationResult.data);
        return createSuccessResponse(HttpStatus.OK, {
            message: 'Asset updated successfully',
            data: updatedAsset,
        });
    }

    async delete(timestamp: string | undefined) {
        if (!timestamp) {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Asset timestamp is required for deletion.');
        }

        const existingAsset = await this.assetsService.getAsset(timestamp);
        if (!existingAsset) {
            return createBadRequestResponse(HttpStatus.NOT_FOUND, 'Asset not found.');
        }

        await this.assetsService.delete(timestamp);
        return createSuccessResponse(HttpStatus.NO_CONTENT);
    }
}
