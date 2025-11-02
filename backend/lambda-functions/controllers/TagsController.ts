import { createSuccessResponse, HttpStatus } from 'ft-common-layer';
import TagsService from 'services/TagsService';
import { Controller } from 'types/Controller';

export class TagsController implements Controller {
    async get() {
        const tags = await TagsService.getAll();
        return createSuccessResponse(HttpStatus.OK, {
            message: 'Expenses retrieved successfully',
            data: {
                tags,
            },
        });
    }
}

export default new TagsController();
