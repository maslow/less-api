import assert = require("assert")
import { LOGIC_COMMANDS, Params, QUERY_COMMANDS } from "../types"


/**
 *  SqlBuilder: Mongo 操作语法生成 SQL 语句
 */
export class SqlBuilder {
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
        if (typeof value === 'string') {
            _v = `"${value}"`
        }
        return _v
    }
}


// class SqlBuilderError extends Error {
//     readonly type = 'sql_builder_error'
//     code: string
//     message: string
//     suggest: string

//     constructor(message: string, code?: string, suggest?: string) {
//         super(message)
//         this.message = message
//         this.code = code
//         this.suggest = suggest
//     }

//     static from(message: string): SqlBuilderError {
//         return new SqlBuilderError(message)
//     }
// }