import { DDBConstants } from 'ft-common-layer';

export class BudgetConfig {
    private userId: string;
    private enabled: boolean;
    private framework: string;

    constructor(data: Record<string, any>, userId: string) {
        this.userId = userId;
        this.enabled = data.enabled ?? false;
        this.framework = data.framework ?? '';
    }

    toDdbItem() {
        return {
            PK: DDBConstants.PARTITIONS.BUDGET_CONFIG(this.userId),
            SK: 'CONFIG',
            enabled: this.enabled,
            framework: this.framework,
        };
    }

    toNormalItem() {
        return {
            enabled: this.enabled,
            framework: this.framework,
        };
    }
}
