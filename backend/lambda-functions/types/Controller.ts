export interface Controller {
    get?(...args: any[]): Promise<any>;
    post?(...args: any[]): Promise<any>;
    put?(...args: any[]): Promise<any>;
    delete?(...args: any[]): Promise<any>;
    patch?(...args: any[]): Promise<any>;
}
