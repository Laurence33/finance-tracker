class DynamoDBService {
    TABLE_NAME: string;
    PK: string;

    constructor(PK: string, TABLE_NAME: string) {
        this.PK = PK;
        this.TABLE_NAME = TABLE_NAME;
    }
}
