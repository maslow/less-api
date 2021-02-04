import { AccessorInterface, ReadResult, UpdateResult, AddResult, RemoveResult, CountResult } from "./accessor"
import { Params, ActionType } from '../types'
import { createConnection, Connection, ConnectionOptions } from 'mysql2/promise'

/**
 * Mysql Accessor
 */

export class MysqlAccessor implements AccessorInterface {

    readonly type: string = 'mysql'
    readonly db_name: string
    readonly options: ConnectionOptions
    conn: Connection

    constructor(db: string, user: string, password: string, options?: ConnectionOptions) {
        this.db_name = db
        this.conn = null
        this.options = options
        this.options.database = db
        this.options.user = user
        this.options.password = password
    }

    async init() {
        this.conn = await createConnection(this.options)
        return
    }

    close() {
        this.conn.destroy()
    }

    async execute(params: Params): Promise<ReadResult | UpdateResult | AddResult | RemoveResult | CountResult | never> {
        const { collection, action } = params


        if (action === ActionType.READ) {
            return await this.read(collection, params)
        }

        if (action === ActionType.UPDATE) {
            return await this.update(collection, params)
        }

        if (action === ActionType.ADD) {
            return await this.add(collection, params)
        }

        if (action === ActionType.REMOVE) {
            return await this.remove(collection, params)
        }

        if (action === ActionType.COUNT) {
            return await this.count(collection, params)
        }

        throw new Error(`invalid 'action': ${action}`)
    }

    async get(_collection: string, _query: any): Promise<any> {
        // todo
    }

    protected async read(_collection: string, _params: Params): Promise<ReadResult> {
        return
    }

    protected async update(_collection: string, _params: Params): Promise<UpdateResult> {
        return
    }

    protected async add(_collection: string, _params: Params): Promise<AddResult> {
        return
    }

    protected async remove(_collection: string, _params: Params): Promise<RemoveResult> {
        return
    }

    protected async count(_collection: string, _params: Params): Promise<CountResult> {
        return
    }
}