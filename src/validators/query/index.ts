import { Handler } from '../../processor'
import { validateField } from './validate'
import { isAllowedFields, execScript } from '../utils'
import { LOGIC_COMMANDS } from '../../types'

const default_allowed_fields = Object.values(LOGIC_COMMANDS);

export const QueryHandler: Handler = async function (config, context) {
    // 缺省时，直接通过
    if (config === undefined) {
        return null
    }
    const { query } = context.params

    if (!query) return 'query is undefined'
    if (typeof query !== 'object') return 'query must be an object'

    const fields = Object.keys(query)
    let allow_fields = []

    // 字符串代表表达式
    if (typeof config === 'string') {
        const { injections } = context
        const global = {
            ...injections,
            ...query
        }
        const result = execScript(config, global)
        if (!result) return 'the expression evaluated to a falsy value'

        return null
    }

    // 数组代表只允许出现的字段
    if (config instanceof Array) {
        allow_fields = config
        const error = isAllowedFields(fields, [...allow_fields, ...default_allowed_fields])
        return error
    }


    // 禁止使用逻辑操作符
    // TODO? 经 `/docs/qa-1.md` 讨论， 操作符查询也是可以被允许的，那么此处就不需要了，后面相应的 isAllowedFields 逻辑也应该去掉。
    // if(hasOperator(fields)) {
    //     return 'operators in query is forbidden'
    // }

    if (typeof config === 'object') {
        allow_fields = Object.keys(config)
        let error = isAllowedFields(fields, [...allow_fields, ...default_allowed_fields])
        if (error) return error

        for (let field of allow_fields) {
            error = await validateField(field, query, config[field], context)
            if (error) return error
        }
        return null
    }

    return 'config error: config must be an array or object'
}
