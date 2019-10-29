
const { validateField, isAllowedFields } = require('./common/validate')

async function DataHandler(config, { ruler, query, data, collection, injections }){
    if(!data) return 'data is undefined'
    if(typeof data !== 'object') return 'data must be an object'

    const fields = Object.keys(data)
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
            error = await validateField(fd, data, config[fd], db, collection)
            if(error) return error
        }
        return null
    }
    
    return 'config error: config must be an array or object'
}

module.exports = DataHandler