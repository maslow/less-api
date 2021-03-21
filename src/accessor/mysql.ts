import { AccessorInterface, ReadResult, UpdateResult, AddResult, RemoveResult, CountResult } from "./accessor"
import { Params, ActionType } from '../types'
import { createPool, Pool, ConnectionOptions, ResultSetHeader, OkPacket, RowDataPacket } from 'mysql2/promise'
import { SqlBuilder } from "./sql_builder"
import { DefaultLogger, Entry } from ".."

/**
 * Mysql Accessor
 */

export class MysqlAccessor implements AccessorInterface {

    readonly type: string = 'mysql'
    readonly db_name: string
    readonly options: ConnectionOptions
    readonly pool: Pool
    private _context: Entry

    get context() {
        return this._context
    }

    private _logger: DefaultLogger

    get logger() {
        if (this._logger) {
            return this._logger
        } else if (this._context) {
            return this._context.getLogger()
        } else {
            this._logger = new DefaultLogger()
            return this._logger
        }
    }

    setLogger(logger: DefaultLogger) {
        this._logger = logger
    }

    get conn(): Pool {
        return this.pool
    }

    constructor(options?: ConnectionOptions) {
        this.db_name = options.database
        this.options = options
        this.pool = createPool(options)
    }

    async init(context?: Entry) {
        this._context = context
        this.logger.info(`mysql accessor init`)
        return
    }

    async close() {
        await this.conn.end()
        this.logger.info('mysql connection closed')
    }

    async execute(params: Params): Promise<ReadResult | UpdateResult | AddResult | RemoveResult | CountResult | never> {
        const { collection, action, requestId } = params

        this.logger.info(`[${requestId}] mysql start executing {${collection}}: ` + JSON.stringify(params))

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

        const error = `invalid 'action': ${action}`
        this.logger.error(`[${requestId}] mysql end of executing occurred:` + error)
        throw new Error(error)
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
        const { collection, requestId } = params
        const { sql, values } = SqlBuilder.from(params).select()

        const nestTables = params.nested ?? false

        this.logger.debug(`[${requestId}] mysql read {${collection}}: `, { sql, values })
        const [rows] = await this.conn.execute<RowDataPacket[]>({ sql, values, nestTables })
        return {
            list: rows
        }
    }

    protected async update(_collection: string, params: Params): Promise<UpdateResult> {
        const { collection, requestId } = params

        const { sql, values } = SqlBuilder.from(params).update()

        this.logger.debug(`[${requestId}] mysql update {${collection}}: `, { sql, values })
        const [ret] = await this.conn.execute<ResultSetHeader>(sql, values)

        return {
            updated: ret.affectedRows,
            matched: ret.affectedRows,
            upsert_id: undefined
        }
    }

    protected async add(_collection: string, params: Params): Promise<AddResult> {
        let { multi, collection, requestId } = params

        if (multi) {
            console.warn('mysql add(): {multi == true} has been ignored!')
        }

        const { sql, values } = SqlBuilder.from(params).insert()

        this.logger.debug(`[${requestId}] mysql add {${collection}}: `, { sql, values })
        const [ret] = await this.conn.execute<ResultSetHeader>(sql, values)

        return {
            _id: ret.insertId as any,
            insertedCount: ret.affectedRows
        }
    }

    protected async remove(_collection: string, params: Params): Promise<RemoveResult> {
        const { collection, requestId } = params

        const { sql, values } = SqlBuilder.from(params).delete()
        this.logger.debug(`[${requestId}] mysql remove {${collection}}: `, { sql, values })

        const [ret] = await this.conn.execute<OkPacket>(sql, values)
        return {
            deleted: ret.affectedRows
        }
    }

    protected async count(_collection: string, params: Params): Promise<CountResult> {
        const { collection, requestId } = params

        const { sql, values } = SqlBuilder.from(params).count()

        this.logger.debug(`[${requestId}] mysql count {${collection}}: `, { sql, values })
        const [ret] = await this.conn.execute<RowDataPacket[]>(sql, values)

        if (ret.length === 0) {
            return { total: 0 }
        }
        return {
            total: ret[0].total
        }
    }
}