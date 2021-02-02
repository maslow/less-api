import { AccessorInterface, ReadResult, UpdateResult, AddResult, RemoveResult, CountResult } from "./accessor"
import { Params, ActionType, Order, Direction, QUERY_COMMANDS, LOGIC_COMMANDS } from '../types'
import { createConnection, Connection, ConnectionOptions } from 'mysql2/promise'
import { assert } from "console"

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

    async get(collection: string, query: any): Promise<any> {
        // todo
    }

    protected async read(collection: string, params: Params): Promise<ReadResult> {
        return
    }

    protected async update(collection: string, params: Params): Promise<UpdateResult> {
        return
    }

    protected async add(collection: string, params: Params): Promise<AddResult> {
        return
    }

    protected async remove(collection: string, params: Params): Promise<RemoveResult> {
        return
    }

    protected async count(collection: string, params: Params): Promise<CountResult> {
        return
    }
}

class SqlBuilder {
    readonly params: Params

    constructor(params: Params) {
        this.params = params
    }

    static fromParams(params: Params): SqlBuilder {
        return new SqlBuilder(params)
    }

    get table(): string {
        return this.params.collection
    }

    get query(): any {
        return this.params.query || {}
    }

    // 验证参数合法性
    validate() {
        const checkQuery = SqlQueryBuilder.from(this.query).validate()
        if (!checkQuery.ok) {
            return checkQuery
        }
    }

    select() {
        const fields = this.buildProjection()
        const query = this.buildQuery()
        const orderBy = this.buildOrder()
        const limit = this.buildLimit()

        const sql = `select ${fields} from ${this.table} ${query} ${limit} ${orderBy}`
        const values = this.buildValues()
        return {
            sql,
            values
        }
    }

    update() {
        const query = this.buildQuery()
        const data = this.buildUpdateData()
        const limit = this.buildLimit()
        const orderBy = this.buildOrder()
        const sql = `update ${this.table} ${data} ${query} ${limit} ${orderBy}`
        const values = this.buildValues()
        return {
            sql,
            values
        }
    }

    delete() {
        const query = this.buildQuery()
        const limit = this.buildLimit()
        const orderBy = this.buildOrder()
        const sql = `delete from ${this.table} ${query} ${limit} ${orderBy}`
        const values = this.buildValues()
        return {
            sql,
            values
        }
    }

    insert() {
        const data = this.buildInsertData()
        const sql = `insert into ${this.table} ${data}`
        return { sql }
    }

    count() {
        const query = this.buildQuery()

        const sql = `select count(*) from ${this.table} ${query}`
        const values = this.buildValues()
        return {
            sql,
            values
        }
    }

    // build query string
    protected buildQuery(): string {
        return SqlQueryBuilder.from(this.query).build()
    }

    // build update data string: set x=a, y=b ...
    protected buildUpdateData(): string {
        return ''
    }

    // build insert data string: (field1, field2) values (a, b, c) ...
    protected buildInsertData(): string {
        return ''
    }

    // TODO
    protected buildOrder(): string {
        return ''
    }

    protected buildLimit(): string {
        const offset = this.params.offset || 0
        const limit = this.params.limit || 100
        return `limit ${offset},${limit}`
    }

    // TODO
    protected buildProjection(): string {
        return '*'
    }

    // TODO
    protected buildValues(): any[] {
        return []
    }
}


class SqlQueryBuilder {

    readonly query: any
    private _values: any[]

    constructor(query: any) {
        this.query = query
    }

    static from(query: any) {
        return new SqlQueryBuilder(query)
    }

    // 验证参数
    validate(): { ok: boolean, error?: string } {
        const r = { ok: false, error: '' }

        // Query 中不允许有嵌套属性
        if (this.hasNestedFieldInQuery()) {
            r.error = 'Invalid Query: nested property found in query'
            return r
        }

        return { ok: true }
    }

    build(): string {
        assert(false === this.hasNestedFieldInQuery())

        let strs = ['where 1=1']
        for (let key in this.query) {
            const value = this.query[key]

            // 若是逻辑操作符
            if (this.isLogicOperator(key)) {
                const _v = this.processLogicOperator(key, value)
                strs.push(_v)
                continue
            }

            // 若是值属性（number, string, boolean)
            if (this.isBasicValue(value)) {
                const _v = this.processBasicValue(value)
                strs.push(`${key} = ${_v}`)
                // this._values.push(_v) // todo
                continue
            }

            // 若是查询操作符(QUERY_COMMANDS)
            if (typeof value === 'object') {
                const _v = this.processQueryOperator(key, value)
                strs.push(_v)
                continue
            }

            throw new Error(`unknow query property found: {${key}: ${value}}`)
        }

        strs = strs.filter(s => s != '' && s != undefined)

        if (strs.length === 1) {
            return strs[0]
        }

        return strs.join(' and ')
    }

    // 处理逻辑操作符的查询
    protected processLogicOperator(key, value) {
        return ''
    }

    // 处理值属性
    protected processBasicValue(value) {
        assert(this.isBasicValue(value))

        const type = typeof value
        switch (type) {
            case 'number':
            case 'boolean':
                return value
            case 'string':
                return `"${value}"`
        }

        throw new Error('unknow basic value found: ' + value)
    }

    // 处理查询逻辑符
    protected processQueryOperator(key, value) {
        return ''
    }

    // 是否为值属性(number, string, boolean)
    protected isBasicValue(value) {
        const type = typeof value
        return ['number', 'string', 'boolean'].includes(type)
    }

    // 是否为逻辑操作符
    protected isLogicOperator(key: string) {
        const keys = Object.keys(LOGIC_COMMANDS)
            .map(k => LOGIC_COMMANDS[k])
        return keys.includes(key)
    }

    // 是否为查询操作符(QUERY_COMMANDS)
    protected isQueryOperator(key: string) {
        const keys = Object.keys(QUERY_COMMANDS)
            .map(k => QUERY_COMMANDS[k])
        return keys.includes(key)
    }

    // 是否为操作符
    protected isOperator(key: string) {
        return this.isLogicOperator(key) || this.isQueryOperator(key)
    }

    // 获取所有的查询操作符
    // @TODO not used
    protected getQueryOperators(): string[] {
        const logics = Object.keys(LOGIC_COMMANDS)
            .map(key => LOGIC_COMMANDS[key])
        const queries = Object.keys(QUERY_COMMANDS)
            .map(key => QUERY_COMMANDS[key])

        return [...logics, ...queries]
    }

    // 判断 Query 中是否有属性嵌套
    protected hasNestedFieldInQuery() {
        for (let key in this.query) {
            // 忽略操作符
            if (this.isOperator(key)) {
                continue
            }

            // 子属性是否有对象
            const obj = this.query[key]
            if (this.hasObjectIn(obj)) {
                return true
            }
        }
        return false
    }

    // 判断给定对象（Object）中是否存在某个属性为对象类型
    protected hasObjectIn(object: any) {
        for (let key in object) {
            // 忽略操作符
            if (this.isOperator(key)) {
                continue
            }
            // 数组也是 object
            if (typeof object[key] === 'object') {
                return true
            }
        }
        return false
    }
}