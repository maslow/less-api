import { AccessorInterface, ReadResult, UpdateResult, AddResult, RemoveResult, CountResult } from "./accessor"
import { Params, ActionType } from '../types'
import { createConnection, Connection, ConnectionOptions, ResultSetHeader, OkPacket, RowDataPacket } from 'mysql2/promise'
import { SqlBuilder } from "./sql_builder"

/**
 * Mysql Accessor
 */

export class MysqlAccessor implements AccessorInterface {

    readonly type: string = 'mysql'
    readonly db_name: string
    readonly options: ConnectionOptions
    conn: Connection

    constructor(options?: ConnectionOptions) {
        this.db_name = options.database
        this.conn = null
        this.options = options
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

    async get(collection: string, query: any): Promise<any> {
        const params: Params = {
            collection: collection,
            action: ActionType.READ,
            query: query,
            limit: 1
        }
        const { sql, values } = SqlBuilder.from(params).select()
        const [rows] = await this.conn.execute(sql, values)
        return (rows as []).length ? rows[0] : null
    }

    protected async read(_collection: string, params: Params): Promise<ReadResult> {
        const { sql, values } = SqlBuilder.from(params).select()
        const [rows] = await this.conn.execute<RowDataPacket[]>(sql, values)
        return {
            list: rows
        }
    }

    protected async update(_collection: string, params: Params): Promise<UpdateResult> {
        const { sql, values } = SqlBuilder.from(params).update()
        const [ret] = await this.conn.execute<ResultSetHeader>(sql, values)

        return {
            updated: ret.affectedRows,
            matched: ret.affectedRows,
            upsert_id: undefined
        }
    }

    protected async add(_collection: string, params: Params): Promise<AddResult> {
        let { multi } = params

        if (multi) {
            console.warn('mysql add(): {multi == true} has been ignored!')
        }

        const { sql, values } = SqlBuilder.from(params).insert()

        const [ret] = await this.conn.execute<ResultSetHeader>(sql, values)

        return {
            _id: ret.insertId as any,
            insertedCount: ret.affectedRows
        }
    }

    protected async remove(_collection: string, params: Params): Promise<RemoveResult> {
        const { sql, values } = SqlBuilder.from(params).delete()
        const [ret] = await this.conn.execute<OkPacket>(sql, values)
        return {
            deleted: ret.affectedRows
        }
    }

    protected async count(_collection: string, params: Params): Promise<CountResult> {
        const { sql, values } = SqlBuilder.from(params).count()
        const [ret] = await this.conn.execute<RowDataPacket[]>(sql, values)

        if (ret.length === 0) {
            return { total: 0 }
        }
        return {
            total: ret[0].total
        }
    }
}