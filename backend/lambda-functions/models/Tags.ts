import { DDBConstants } from 'ft-common-layer';
import { CreateTagsRequestBody } from 'types/Tags';

export class Tags {
    private userId: string;
    private name: string;
    private budget: number;
    private createdAt: Date | null;

    constructor(data: CreateTagsRequestBody | Record<string, any>, userId: string) {
        this.userId = userId;
        if (data.SK) {
            this.name = data.SK; // from DynamoDB
            this.budget = data.budget ?? 0;
            this.createdAt = data.createdAt ? new Date(data.createdAt) : null;
        } else {
            this.name = data.name;
            this.budget = data.budget ?? 0;
            this.createdAt = new Date();
        }
    }

    toDdbItem() {
        return {
            PK: DDBConstants.PARTITIONS.TAGS(this.userId),
            SK: this.name,
            budget: this.budget,
            createdAt: this.createdAt?.toISOString(),
        };
    }

    toNormalItem() {
        return {
            name: this.name,
            budget: this.budget,
            createdAt: this.createdAt,
        };
    }
}
