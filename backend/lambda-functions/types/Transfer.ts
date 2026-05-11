export type CreateTransferRequestBody = {
    timestamp: string;
    sourceFundSource: string;
    destinationFundSource: string;
    amount: number;
    fee: number;
    note: string;
    SK?: string;
    LSI1SK?: string;
};
