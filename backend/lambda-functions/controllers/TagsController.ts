import { createBadRequestResponse, createSuccessResponse, generateValidationErrors, HttpStatus } from 'ft-common-layer';
import { TagsService } from 'services/TagsService';
import { Controller } from 'types/Controller';
import { CreateTagValidator, UpdateTagValidator } from 'validators/CreateTagValidator';
import { treeifyError } from 'zod/v4';

export class TagsController implements Controller {
    private tagsService: TagsService;

    constructor(userId: string) {
        this.tagsService = new TagsService(userId);
    }

    async get() {
        const tags = await this.tagsService.getAll();
        return createSuccessResponse(HttpStatus.OK, {
            message: 'Tags retrieved successfully',
            data: {
                tags,
            },
        });
    }

    async post(body: any) {
        const validationResult = CreateTagValidator.safeParse(body);

        if (!validationResult.success) {
            const errors = treeifyError(validationResult.error).properties;
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Validation failed', errors);
        }

        const existingTag = await this.tagsService.getTag(validationResult.data.name);
        if (existingTag) {
            return createBadRequestResponse(
                HttpStatus.BAD_REQUEST,
                'Validation failed',
                generateValidationErrors({ name: ['Tag name already exists.'] }),
            );
        }

        const tag = await this.tagsService.create({
            name: validationResult.data.name,
            budget: validationResult.data.budget,
        });

        return createSuccessResponse(HttpStatus.OK, {
            message: 'Tag created successfully',
            data: tag,
        });
    }

    async patch(name: string | undefined, body: any) {
        if (!name) {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Tag name is required for update.');
        }

        const validationResult = UpdateTagValidator.safeParse(body);
        if (!validationResult.success) {
            const errors = treeifyError(validationResult.error).properties;
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Validation failed', errors);
        }

        const existingTag = await this.tagsService.getTag(name);
        if (!existingTag) {
            return createBadRequestResponse(HttpStatus.NOT_FOUND, 'Tag not found.');
        }

        // Block edit if tag is in use by expenses
        // TODO: consider blocking edit entirely, since expensive in the long run
        const inUse = await this.tagsService.checkInUse(existingTag);
        if (inUse && existingTag.toNormalItem().name !== validationResult.data.name) {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Cannot edit tag that is in use by expenses.');
        }

        if (validationResult.data.name !== name) {
            const duplicateTag = await this.tagsService.getTag(validationResult.data.name);
            if (duplicateTag) {
                return createBadRequestResponse(
                    HttpStatus.BAD_REQUEST,
                    'Validation failed',
                    generateValidationErrors({ name: ['Tag name already exists.'] }),
                );
            }
        }

        const updatedTag = await this.tagsService.update(name, validationResult.data.name, validationResult.data.budget);

        return createSuccessResponse(HttpStatus.OK, {
            message: 'Tag updated successfully',
            data: updatedTag,
        });
    }

    async delete(name: string | undefined) {
        if (!name) {
            return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Tag name is required for deletion.');
        }

        const existingTag = await this.tagsService.getTag(name);
        if (!existingTag) {
            return createBadRequestResponse(HttpStatus.NOT_FOUND, 'Tag not found.');
        }

        await this.tagsService.delete(name);

        return createSuccessResponse(HttpStatus.NO_CONTENT);
    }
}
