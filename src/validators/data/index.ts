import { Handler } from '../../processor'
import { validateField, flattenData } from './validate'
import { isAllowedFields } from '../utils'


export const DataHandler: Handler = async function (config, context){
    const { data } = context.params
    
    if(!data) return 'data is undefined'
    if(typeof data !== 'object') return 'data must be an object'

    const flatten = flattenData(data)
    const fields = Object.keys(flatten)
    let allow_fields = []

    if(config instanceof Array){
        allow_fields = config
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
