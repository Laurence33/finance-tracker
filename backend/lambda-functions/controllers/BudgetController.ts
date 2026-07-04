import { createBadRequestResponse, createSuccessResponse, HttpStatus } from 'ft-common-layer';
import { BudgetService } from 'services/BudgetService';
import { FrameworkService } from 'services/FrameworkService';
import { Controller } from 'types/Controller';
import { BadRequestException } from 'utils/Exceptions';

export class BudgetController implements Controller {
    private budgetService: BudgetService;
    private frameworkService: FrameworkService;

    constructor(userId: string) {
        this.budgetService = new BudgetService(userId);
        this.frameworkService = new FrameworkService();
    }

    async get() {
        const budget = await this.budgetService.getBudget();
        return createSuccessResponse(HttpStatus.OK, {
            message: 'Budget retrieved successfully',
            data: budget,
        });
    }

    async getFrameworks() {
        const frameworks = await this.frameworkService.listFrameworks();
        return createSuccessResponse(HttpStatus.OK, {
            message: 'Frameworks retrieved successfully',
            data: { frameworks },
        });
    }

    async put(body: any) {
        const enabled = body?.enabled === true;

        if (enabled) {
            const framework = await this.frameworkService.getFramework(body?.framework);
            if (!framework) {
                return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Unknown budgeting framework.');
            }

            // Validate any provided seed allocations: known keys, non-negative numbers.
            const allocations = body?.initialAllocations;
            if (allocations !== undefined && allocations !== null) {
                if (typeof allocations !== 'object') {
                    return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'initialAllocations must be an object.');
                }
                const validKeys = new Set(framework.buckets.map((b) => b.key));
                for (const [key, value] of Object.entries(allocations)) {
                    if (!validKeys.has(key)) {
                        return createBadRequestResponse(HttpStatus.BAD_REQUEST, `Unknown bucket '${key}'.`);
                    }
                    if (typeof value !== 'number' || isNaN(value) || value < 0) {
                        return createBadRequestResponse(HttpStatus.BAD_REQUEST, `Invalid allocation for '${key}'.`);
                    }
                }
            }
        }

        try {
            const budget = await this.budgetService.setConfig({
                enabled,
                framework: body?.framework,
                initialAllocations: body?.initialAllocations,
                reseed: body?.reseed === true,
            });
            return createSuccessResponse(HttpStatus.OK, {
                message: 'Budget updated successfully',
                data: budget,
            });
        } catch (error: any) {
            if (error instanceof BadRequestException) {
                return createBadRequestResponse(error.statusCode, error.message);
            }
            if (error.name === 'TransactionCanceledException') {
                return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Transaction failed.');
            }
            throw error;
        }
    }

    async delete() {
        const config = await this.budgetService.getConfig();
        if (config.enabled) {
            return createBadRequestResponse(
                HttpStatus.BAD_REQUEST,
                'Disable the framework before deleting it.',
            );
        }
        try {
            await this.budgetService.deleteBudget();
            return createSuccessResponse(HttpStatus.NO_CONTENT);
        } catch (error: any) {
            if (error.name === 'TransactionCanceledException') {
                return createBadRequestResponse(HttpStatus.BAD_REQUEST, 'Transaction failed.');
            }
            throw error;
        }
    }
}
