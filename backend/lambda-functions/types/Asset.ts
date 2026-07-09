export type CreateAssetRequestBody = {
    name: string;
    value: number;
    category: string;
    notes: string;
    fundSource?: string;
    SK?: string;
};
