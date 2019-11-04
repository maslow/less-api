
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
    count: number
}


export interface AccessorInterface {
    type: string,
    init(): Promise<void>,
    execute(params: object): Promise<ReadResult | UpdateResult | AddResult | RemoveResult | CountResult>,
    get(collection: string, query: any): Promise<any>
}


// export class Accessor implements AccessorInterface{
//     protected type: string
//     constructor(){
//     }

//     async init() {
//     }

//     async execute(params: Object): Promise<Object> {
//         return
//     }
// }