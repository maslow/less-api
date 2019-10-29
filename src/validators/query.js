
const { validateField, isAllowedFields } = require('./common/validate')

async function QueryHandler(config, { ruler, query, data, collection, injections }){
    if(!query) return 'query is undefined'
    if(typeof query !== 'object') return 'query must be an object'

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

        const db = ruler.db
        for(let fd of allow_fields){
            error = await validateField(fd, query, config[fd], db, collection)
            if(error) return error
        }
        return null
    }
    
    return 'config error: config must be an array or object'
}

module.exports = QueryHandler