import assert = require("assert")
import { Direction, LOGIC_COMMANDS, Order, Params, QUERY_COMMANDS } from "../types"


/**
 *  SqlBuilder: Mongo 操作语法生成 SQL 语句
 */
export class SqlBuilder {
    readonly params: Params
    private _values: any[] = []

    constructor(params: Params) {
        this._values = []
        this.params = params
    }

    static from(params: Params): SqlBuilder {
        return new SqlBuilder(params)
    }

    get table(): string {
        return this.params.collection
    }

    get query(): any {
        return this.params.query || {}
    }

    get projection(): any {
        return this.params.projection || {}
    }

    get orders(): Order[] {
        return this.params.order || []
    }

    get data(): any {
        return this.params.data || {}
    }

    select() {
        const fields = this.buildProjection()
        const query = this.buildQuery()
        const orderBy = this.buildOrder()
        const limit = this.buildLimit()

        const sql = `select ${fields} from ${this.table} ${query} ${orderBy} ${limit}`
        const values = this.values()
        return {
            sql,
            values
        }
    }

    update() {
        this.checkData()

        const data = this.buildUpdateData()
        const query = this.buildQuery()

        // 当 multi 为 true 时允许多条更新，反之则只允许更新一条数据
        // multi 默认为 false
        const multi = this.params.multi
        const limit = multi ? '' : `limit 1`
        const orderBy = this.buildOrder()

        const sql = `update ${this.table} ${data} ${query} ${orderBy} ${limit}`
        const values = this.values()

        return { sql, values }
    }

    delete() {
        const query = this.buildQuery()

        // 当 multi 为 true 时允许多条更新，反之则只允许更新一条数据
        const multi = this.params.multi
        const limit = multi ? '' : `limit 1`
        const orderBy = this.buildOrder()
        const sql = `delete from ${this.table} ${query} ${orderBy} ${limit} `
        const values = this.values()
        return {
            sql,
            values
        }
    }

    insert() {
        this.checkData()
        const data = this.buildInsertData()
        const sql = `insert into ${this.table} ${data}`
        const values = this.values()
        return { sql, values }
    }

    count() {
        const query = this.buildQuery()

        const sql = `select count(*) as total from ${this.table} ${query}`
        const values = this.values()
        return {
            sql,
            values
        }
    }

    protected addValues(values: any[]) {
        this._values.push(...values)
    }

    // build query string
    protected buildQuery(): string {
        const builder = SqlQueryBuilder.from(this.query)
        const sql = builder.build()
        const values = builder.values()
        this.addValues(values)

        return sql
    }

    // build update data string: set x=a, y=b ...
    protected buildUpdateData(): string {
        let strs = []
        for (const key in this.data) {
            const _val = this.data[key]
            assert(this.isBasicValue(_val), `invalid data: value of data only support BASIC VALUE(number|boolean|string|undefined), {${key}:${_val}} given`)
            this.addValues([_val])
            strs.push(`${key}=?`)
        }
        return 'set ' + strs.join(',')
    }

    // build insert data string: (field1, field2) values (a, b, c) ...
    protected buildInsertData(): string {
        const fields = Object.keys(this.data)
        const values = fields.map(key => {
            const _val = this.data[key]
            assert(this.isBasicValue(_val), `invalid data: value of data only support BASIC VALUE(number|boolean|string|undefined), {${key}:${_val}} given`)
            this.addValues([_val])
            return '?'
        })

        const s_fields = fields.join(',')
        const s_values = values.join(',')

        return `(${s_fields}) values (${s_values})`
    }

    protected buildOrder(): string {
        if (this.orders.length === 0) {
            return ''
        }
        const strs = this.orders.map(ord => {
            assert([Direction.ASC, Direction.DESC].includes(ord.direction), `invalid query: order value of {${ord.field}:${ord.direction}} MUST be 'desc' or 'asc'`)
            return `${ord.field} ${ord.direction}`
        })
        return 'order by ' + strs.join(',')
    }

    protected buildLimit(_limit?: number): string {
        const offset = this.params.offset || 0
        const limit = this.params.limit || _limit || 100
        assert(typeof offset === 'number', 'invalid query: offset must be number')
        assert(typeof limit === 'number', 'invalid query: limit must be number')

        return `limit ${offset},${limit}`
    }

    /**
     * 指定返回的字段
     * @tip 在 mongo 中可以指定只显示哪些字段 或者 不显示哪些字段，而在 SQL 中我们只支持[只显示哪些字段]
     * 示例数据:    `projection: { age: 1, f1: 1}`
     */
    protected buildProjection(): string {
        let fields = []
        for (const key in this.projection) {
            const value = this.projection[key]
            assert(value, `invalid query: value of projection MUST be {true} or {1}, {false} or {0} is not supported in sql`)
            fields.push(key)
        }
        if (fields.length === 0) {
            return '*'
        }
        return fields.join(',')
    }

    protected values(): any[] {
        return this._values || []
    }

    // 是否为值属性(number, string, boolean)
    protected isBasicValue(value) {
        const type = typeof value
        return ['number', 'string', 'boolean', 'undefined'].includes(type)
    }

    // data 不可为空
    protected checkData() {
        assert(this.data, `invalid data: data can NOT be ${this.data}`)
        assert(typeof this.data === 'object', `invalid data: data must be an object`)

        assert(!(this.data instanceof Array), `invalid data: data cannot be Array while using SQL`)

        const keys = Object.keys(this.data)
        assert(keys.length, `invalid data: data can NOT be empty object`)
    }
}

/**
 * Mongo 查询转换为 SQL 查询
 */
export class SqlQueryBuilder {

    readonly query: any
    private _values: any[] = []  // SQL 参数化使用，收集SQL参数值

    constructor(query: any) {
        this.query = query
    }

    static from(query: any) {
        return new SqlQueryBuilder(query)
    }

    // 
    build(): string | null {
        assert(this.hasNestedFieldInQuery() === false, 'invalid query: nested property in query')

        let strs = ['where 1=1']
        // 遍历查询属性
        for (const key in this.query) {
            const v = this.buildOne(key, this.query[key])
            strs.push(v)
        }

        strs = strs.filter(s => s != '' && s != undefined)
        if (strs.length === 1) {
            return strs[0]
        }

        return strs.join(' and ')

    }

    values(): any[] {
        return this._values
    }

    // 处理一条查询属性（逻辑操作符属性、值属性、查询操作符属性）
    protected buildOne(key: string, value: any) {
        // 若是逻辑操作符
        if (this.isLogicOperator(key)) {
            return this.processLogicOperator(key, value)
        }

        // 若是值属性（number, string, boolean)
        if (this.isBasicValue(value)) {
            return this.processBasicValue(key, value, QUERY_COMMANDS.EQ)
        }

        // 若是查询操作符(QUERY_COMMANDS)
        if (typeof value === 'object') {
            return this.processQueryOperator(key, value)
        }

        throw new Error(`unknow query property found: {${key}: ${value}}`)
    }

    // 递归处理逻辑操作符的查询($and $or)
    /**
    ```js
        query = {
        f1: 0,
        '$or': [
            { f2: 1},
            { f6: { '$lt': 4000 } },
            {
            '$and': [ { f6: { '$gt': 6000 } }, { f6: { '$lt': 8000 } } ]
            }
        ]
        }
        // where 1=1 and f1 = 0 and (f2 = 1 and f6 < 4000 or (f6 > 6000 and f6 < 8000))
    ```
    */
    protected processLogicOperator(operator: string, value: any[]) {
        const that = this

        function _process(key: string, _value: any[] | any): string {
            // 如果是逻辑符，则 value 为数组遍历子元素
            if (that.isLogicOperator(key)) {
                assert(_value instanceof Array, `invalid query: value of logic operator must be array, but ${_value} given`)

                let result = []
                for (const item of _value) { // 逻辑符子项遍历
                    for (const k in item) { // 操作
                        const r = _process(k, item[k])
                        result.push(r)
                    }
                }
                // 将逻辑符中每个子项的结果用 逻辑符 连接起来
                const op = that.mapLogicOperator(key)
                const _v = result.join(` ${op} `)   // keep spaces in both ends
                return `(${_v})`  // 
            }

            // 若是值属性（number, string, boolean)
            if (that.isBasicValue(_value)) {
                return that.processBasicValue(key, _value, QUERY_COMMANDS.EQ)
            }

            // 若是查询操作符(QUERY_COMMANDS)
            if (typeof _value === 'object') {
                return that.processQueryOperator(key, _value)
            }
        }

        return _process(operator, value)
    }

    // 处理值属性
    protected processBasicValue(field: string, value: string | number | boolean | [], operator: string) {
        const op = this.mapQueryOperator(operator)

        let _v = null

        // $in $nin 值是数组, 需单独处理
        const { IN, NIN } = QUERY_COMMANDS
        if ([IN, NIN].includes(operator)) {
            (value as any[]).forEach(v => this.addValue(v))

            // const arr = (value as any[]).map(v => this.wrapBasicValue(v))
            const arr = (value as any[]).map(_ => '?')
            const vals = arr.join(',')
            _v = `(${vals})`
        } else {
            assert(this.isBasicValue(value), `invalid query: typeof '${field}' must be number | string | boolean, but ${typeof value} given`)
            this.addValue(value)
            // _v = this.wrapBasicValue(value as any)
            _v = '?'
        }

        return `${field} ${op} ${_v}`
    }

    // 处理查询操作符属性
    protected processQueryOperator(field: string, value: any) {
        let strs = []
        // key 就是查询操作符
        for (let key in value) {
            // @todo 暂且跳过[非]查询操作符，这种情况应该报错，建议使用类实现属性管理错误
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

    protected addValue(value: any) {
        const val = this.wrapBasicValue(value)
        this._values.push(val)
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
    public hasNestedFieldInQuery() {
        for (let key in this.query) {
            // 忽略对象顶层属性操作符
            if (this.isOperator(key)) {
                continue
            }
            // 子属性是否有对象
            const obj = this.query[key]
            if (typeof obj !== 'object') {
                continue
            }

            if (this.hasObjectIn(obj)) {
                return true
            }
        }
        return false
    }

    // 判断给定对象（Object）中是否存在某个属性为非操作符对象
    protected hasObjectIn(object: any) {
        for (let key in object) {
            // 检测到非操作符对象，即判定存在
            if (!this.isOperator(key)) {
                return true
            }
        }
        return false
    }

    // 转换 mongo 查询操作符到 sql
    protected mapQueryOperator(operator: string) {
        assert(this.isQueryOperator(operator), `invalid query: operator ${operator} must be query operator`)
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
                op = 'in'
                break
            case QUERY_COMMANDS.NIN:
                op = 'not in'
        }

        assert(op != '', `invalid query: unsupperted query operator ${operator}`)
        return op
    }

    // 转换 mongo 逻辑操作符到 sql
    protected mapLogicOperator(operator: string) {
        assert(this.isLogicOperator(operator), `invalid query: operator ${operator} must be logic operator`)

        let op = ''
        switch (operator) {
            case LOGIC_COMMANDS.AND:
                op = 'and'
                break
            case LOGIC_COMMANDS.OR:
                op = 'or'
                break
        }

        assert(op != '', `invalid query: unsupperted logic operator ${operator}`)
        return op
    }

    // 处理基本类型的值（SQL化）
    protected wrapBasicValue(value: string | number | boolean) {
        let _v = value
        // 暂且注释掉，可能用不到了
        // if (typeof value === 'string') {
        //     _v = `"${value}"`
        // }
        return _v
    }
}