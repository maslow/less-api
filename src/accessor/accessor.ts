import { Entry } from ".."
import { DefaultLogger } from "../logger"
import { Params } from "../types"

export interface ReadResult {
    list: object[]
}

export interface UpdateResult {
    upsert_id: string,
    updated: number,
    matched: number
}

export interface AddResult {
    _id: string,
    insertedCount: number
}

export interface RemoveResult {
    deleted: number
}

export interface CountResult {
    total: number
}


export interface AccessorInterface {
    type: string,
    context: Entry,
    logger: DefaultLogger
    setLogger(logger: DefaultLogger): void
    init(context?: Entry): Promise<void>
    execute(params: Params): Promise<ReadResult | UpdateResult | AddResult | RemoveResult | CountResult>
    get(collection: string, query: any): Promise<any>
    close(): void
}