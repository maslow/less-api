import { AccessorInterface, ReadResult, UpdateResult, AddResult, RemoveResult, CountResult } from "./accessor";
import { Params } from './../types';
import { MongoClientOptions } from 'mongodb';
export declare class MongoAccessor implements AccessorInterface {
    readonly type: string;
    private db_name;
    private conn;
    private db;
    constructor(db: string, url: string, options?: MongoClientOptions);
    init(): Promise<void>;
    execute(params: Params): Promise<ReadResult | UpdateResult | AddResult | RemoveResult | CountResult | never>;
    get(collection: string, query: any): Promise<any>;
    private read;
    private update;
    private add;
    private remove;
    private count;
    private processOrder;
}
