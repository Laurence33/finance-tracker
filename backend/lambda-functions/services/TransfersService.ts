import { QueryCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { DDBConstants } from 'ft-common-layer';
import { Transfer } from '../models/Transfer';
import { CreateTransferRequestBody } from '../types/Transfer';
import { Expense } from '../models/Expense';
import { ddbDocClient } from './ddb-client';
import { TagsService } from './TagsService';

const SINGLE_TABLE_NAME = DDBConstants.DDB_TABLE_NAME;

export class TransfersService {
    private tagsService: TagsService;

    constructor(private userId: string) {
        this.tagsService = new TagsService(userId);
    }

    private get transferPk() { return DDBConstants.PARTITIONS.TRANSFER(this.userId); }
    private get fundSourcePk() { return DDBConstants.PARTITIONS.FUND_SOURCE(this.userId); }

    async getAll() {
        const command = new QueryCommand({
            TableName: SINGLE_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': this.transferPk,
            },
            ScanIndexForward: false,
        });
        const response = await ddbDocClient.send(command);
        const transfers = response.Items?.map((item) => new Transfer(item, this.userId).toNormalItem());
        return transfers || [];
    }

    async create(body: CreateTransferRequestBody) {
        const transfer = new Transfer(body, this.userId);
        const transferItem = transfer.toNormalItem();
        const totalDeducted = body.amount + body.fee;

        const transactItems: any[] = [
            {
                Put: {
                    TableName: SINGLE_TABLE_NAME,
                    Item: transfer.toDdbItem(),
                },
            },
            {
                Update: {
                    TableName: SINGLE_TABLE_NAME,
                    Key: {
                        PK: this.fundSourcePk,
                        SK: body.sourceFundSource,
                    },
                    UpdateExpression: 'SET balance = balance - :amt',
                    ConditionExpression: 'attribute_exists(PK) AND (isCreditCard = :true OR balance >= :amt)',
                    ExpressionAttributeValues: {
                        ':amt': totalDeducted,
                        ':true': true,
                    },
                },
            },
            {
                Update: {
                    TableName: SINGLE_TABLE_NAME,
                    Key: {
                        PK: this.fundSourcePk,
                        SK: body.destinationFundSource,
                    },
                    UpdateExpression: 'SET balance = balance + :amt',
                    ConditionExpression: 'attribute_exists(PK)',
                    ExpressionAttributeValues: {
                        ':amt': body.amount,
                    },
                },
            },
        ];

        if (body.fee > 0) {
            const feeNote = body.note
                ? `Transfer ₱${body.amount.toLocaleString()} from ${body.sourceFundSource} to ${body.destinationFundSource} — ${body.note}`
                : `Transfer ₱${body.amount.toLocaleString()} from ${body.sourceFundSource} to ${body.destinationFundSource}`;

            const feeExpense = new Expense({
                timestamp: transferItem.timestamp,
                amount: body.fee,
                fundSource: body.sourceFundSource,
                tags: ['Transfer Fee'],
                notes: feeNote,
            }, this.userId);

            transactItems.push({
                Put: {
                    TableName: SINGLE_TABLE_NAME,
                    Item: feeExpense.toDdbItem(),
                },
            });

            // Create "Transfer Fee" tag if it doesn't exist. Done outside the
            // TransactWrite because an idempotent "create if not exists" inside
            // the transaction would fail on every subsequent transfer.
            const existingTags = await this.tagsService.getAll();
            const tagExists = existingTags.some((t) => t.name === 'Transfer Fee');
            if (!tagExists) {
                await this.tagsService.create({ name: 'Transfer Fee', budget: 0 });
            }
        }

        await ddbDocClient.send(new TransactWriteCommand({ TransactItems: transactItems }));
        return transferItem;
    }
}
