import { Handler } from '../../processor'
import { validateField, flattenData } from './validate'
import { isAllowedFields, execScript } from '../utils'
import { UPDATE_COMMANDS } from '../..'


export const DataHandler: Handler = async function (config, context){
    const { data, merge } = context.params
    
    if(!data) return 'data is undefined'
    if(typeof data !== 'object') return 'data must be an object'

    const flatten = flattenData(data)
    const fields = Object.keys(flatten)
    let allow_fields = []

    // merge 不为 true 时不能有操作符
    const opt = hasOperator(data)
    if(!merge && opt) {
        return 'data must not contain any operator while `merge` with false'
    }

    //  merge 为 true 时必须有操作符, 
    if(merge && !opt) {
        return 'data must contain operator while `merge` with true'
    }
    

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


function hasOperator (data){
    const OPTRS = Object.values(UPDATE_COMMANDS)

    let has = false
    const checkMixed = objs => {
        if (typeof objs !== 'object') return

        for (let key in objs) {
            if (OPTRS.includes(key)) {
                has = true
            } else if (typeof objs[key] === 'object') {
                checkMixed(objs[key])
            }
        }
    }
    checkMixed(data)

    return has
}