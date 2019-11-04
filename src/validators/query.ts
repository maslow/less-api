import { Handler } from './../processor';
import { validateField, isAllowedFields } from './common/validate'

export const QueryHandler: Handler = async function (config, context){
    const { params, ruler } = context

    const { query, collection } = params

    if(!query) return 'data is undefined'
    if(typeof query !== 'object') return 'data must be an object'

    const fields = Object.keys(query)
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

        const accessor = ruler.accessor
        for(let field of allow_fields){
            error = await validateField(field, query, config[field], accessor, collection)
            if(error) return error
        }
        return null
    }
    
    return 'config error: config must be an array or object'
}