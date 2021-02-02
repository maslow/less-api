import { AccessorInterface, ReadResult, UpdateResult, AddResult, RemoveResult, CountResult } from "./accessor"
import { Params, ActionType, Order, Direction, QUERY_COMMANDS, LOGIC_COMMANDS } from '../types'
import { createConnection, Connection, ConnectionOptions } from 'mysql2/promise'
import * as assert from 'assert'

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

/**
 *  SqlBuilder: Mongo 操作语法生成 SQL 语句
 */
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


/**
 * Mongo 查询转换为 SQL 查询
 */
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
                const ret = this.processLogicOperator(key, value)
                strs.push(ret)
                continue
            }

            // 若是值属性（number, string, boolean)
            if (this.isBasicValue(value)) {
                const ret = this.processBasicValue(key, value, QUERY_COMMANDS.EQ)
                strs.push(ret)
                continue
            }

            // 若是查询操作符(QUERY_COMMANDS)
            if (typeof value === 'object') {
                const ret = this.processQueryOperator(key, value)
                strs.push(ret)
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
    protected processLogicOperator(operator: string, value: any[]) {
        return ''
    }

    // 处理值属性
    protected processBasicValue(field: string, value: string | number | boolean | [], operator: string) {
        const op = this.mapQueryOperator(operator)

        let _v = null

        // $in $nin 值是数组, 需单独处理
        const { IN, NIN } = QUERY_COMMANDS
        if ([IN, NIN].includes(operator)) {
            const arr = (value as any[]).map(v => {
                return this.wrapBasicValue(v)
            })
            const vals = arr.join(',')
            _v = `(${vals})`
        } else {
            assert(this.isBasicValue(value))
            _v = this.wrapBasicValue(value as any)
        }

        return `${field} ${op} ${_v}`
    }

    // 处理查询逻辑符
    protected processQueryOperator(field: string, value: any) {
        let strs = []
        // key 就是逻辑操作符
        for (let key in value) {
            // @todo 暂且跳过[非]查询逻辑符，这种情况应该报错，建议使用类实现属性管理错误
            if (!this.isQueryOperator(key)) {
                continue
            }

            const sub_value = value[key]
            const result = this.processBasicValue(field, sub_value, key)
            strs.push(result)
        }
        strs = strs.filter(s => s != '' && s != undefined)
        if (strs.length === 0) {
            return ''
        }
        return strs.join(' and ')
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

    // 转换 mongo 查询操作符到 sql
    protected mapQueryOperator(operator: string) {
        assert(this.isQueryOperator(operator))
        let op = ''
        switch (operator) {
            case QUERY_COMMANDS.EQ:
                op = '='
                break
            case QUERY_COMMANDS.NEQ:
                op = '<>'
                break
            case QUERY_COMMANDS.GT:
                op = '>'
                break
            case QUERY_COMMANDS.GTE:
                op = '>='
                break
            case QUERY_COMMANDS.LT:
                op = '<'
                break
            case QUERY_COMMANDS.LTE:
                op = '<='
                break
            case QUERY_COMMANDS.IN:
                op = ' in ' // TIP: keep space in both sides
                break
            case QUERY_COMMANDS.NIN:
                op = ' not in '  // TIP: keep space in both sides
        }

        assert(op != '')

        return op
    }

    // 处理基本类型的值（SQL化）
    protected wrapBasicValue(value: string | number | boolean) {
        let _v = value
        if (typeof value === 'string') {
            _v = `"${value}"`
        }
        return _v
    }
}