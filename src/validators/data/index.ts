import { Handler } from '../../processor'
import { validateField, flattenData } from './validate'
import { isAllowedFields, execScript } from '../utils'


export const DataHandler: Handler = async function (config, context){
    const { data } = context.params
    
    if(!data) return 'data is undefined'
    if(typeof data !== 'object') return 'data must be an object'

    const flatten = flattenData(data)
    const fields = Object.keys(flatten)
    let allow_fields = []

    // 字符串代表表达式
    if(typeof config === 'string') {
        const { injections } = context
        const global = {
            ...injections,
            ...data
        }
        const result = execScript(config, global)
        if(!result) return 'the expression evaluated to a falsy value'
        
        return null
    }

    // 数组代表只允许出现的字段
    if(config instanceof Array){
        allow_fields = Object.keys(config)
        const error = isAllowedFields(fields, allow_fields)
        return error
    }

    if(typeof config === 'object'){
        allow_fields = Object.keys(config)
        let error = isAllowedFields(fields, allow_fields)
        if(error) return error

        for(let field of allow_fields){
            error = await validateField(field, data, config[field], context)
            if(error) return error
        }
        return null
    }
    
    return 'config error: config must be an array or object'
}
