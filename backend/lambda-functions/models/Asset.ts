import { DDBConstants } from 'ft-common-layer';
import { CreateAssetRequestBody } from 'types/Asset';

export class Asset {
    private userId: string;
    private timestamp: string;
    private name: string;
    private value: number;
    private category: string;
    private notes: string;

    constructor(data: CreateAssetRequestBody | Record<string, any>, userId: string) {
        this.userId = userId;
        if (data.SK) {
            this.timestamp = data.SK;
        } else {
            this.timestamp = new Date().toISOString().replace('Z', '').replace('T', ' ');
        }

        this.name = data.name;
        this.value = data.value;
        this.category = data.category || '';
        this.notes = data.notes || '';
    }

    toDdbItem() {
        return {
            PK: DDBConstants.PARTITIONS.ASSET(this.userId),
            SK: this.timestamp,
            name: this.name,
            value: this.value,
            category: this.category,
            notes: this.notes,
        };
    }

    toNormalItem() {
        return {
            timestamp: this.timestamp,
            name: this.name,
            value: this.value,
            category: this.category,
            notes: this.notes,
        };
    }
}
