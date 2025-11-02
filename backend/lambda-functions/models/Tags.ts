import { DDBConstants } from 'ft-common-layer';
import { CreateTagsRequestBody } from 'types/Tags';

export class Tags {
    private PK = DDBConstants.PARTITIONS.TAGS;
    private name: string;

    constructor(data: CreateTagsRequestBody | Record<string, any>) {
        if (data.SK) this.name = data.SK; // from DynamoDB
        else this.name = data.name;
    }

    toDdbItem() {
        return {
            PK: this.PK,
            SK: this.name,
        };
    }

    toNormalItem() {
        return {
            name: this.name,
        };
    }
}
