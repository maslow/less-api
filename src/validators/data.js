const $ = require('validator')

const RULE_KEYS = [
    'required', 'in', 'default',
    'length', 'number',
    'match', 'exists'
]

async function DataHandler(config, { ruler, query, data, injections }){
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

        for(let fd of allow_fields){
            error = await validateField(fd, data, config[fd])
            if(error) return error
        }
        return null
    }
    
    return 'config error: config must be an array or object'
}

/**
 * @param {String} field key of data
 * @param {Object} data data
 * @param {Object} rules validator rule of the field
 */
async function validateField(field, data, rules){
    if(typeof rules !== 'object') {
        return `config error: [${field}]'s rules must be an object`
    }

    // if required == true
    const isRequired = rules['required'] == true
    if(data[field] === undefined || data[field] === null) {
        // if default
        if(rules['default'] !== undefined && rules['default'] !== null) {
            data[field] = rules['default']
        }else{
            return isRequired ? `${field} is required` : null
        }
    }

    const rule_names = Object.keys(rules)
        .filter(name => ['required', 'default'].includes(name) == false)

    for(let name of rule_names) {
        const options = rules[name]
        const error = await _validate(name, options, field, data)
        if(error) return error
    }

    return null
}

/**
 * @param {String} ruleName 
 * @param {Any} ruleOptions 
 * @param {String} field 
 * @param {Object} data 
 */
async function _validate(ruleName, ruleOptions, field, data) {
    if(!RULE_KEYS.includes(ruleName)){
        return `config error: unknown rule [${name}]`
    }

    const value = data[field]

    if(ruleName === 'in') {
        if(!(ruleOptions instanceof Array)) {
            return `config error: ${field}#in must be an array`
        }

        if(!ruleOptions.includes(value)){
            return `invalid ${field}`
        }
    }

    if(ruleName === 'length') {
        if(!(ruleOptions instanceof Array && ruleOptions.length)) {
            return `config error: ${field}#length must be an array with 1-2 integer element, ex. [3, 10]`
        }

        const min = ruleOptions[0]
        const max = ruleOptions.length >= 2 ? ruleOptions[1] : undefined
        const ok = $.isLength(value, min, max)
        if(!ok) {
            let error = `length of ${field} should >= ${min}`
            if(max !== undefined) error += ` and <= ${max}`
            return error
        }
    }

    if(ruleName === 'number') {
        if(!(ruleOptions instanceof Array && ruleOptions.length)) {
            return `config error: ${field}#number must be an array with 1-2 integer element, ex. [3, 10]`
        }

        const min = ruleOptions[0]
        const max = ruleOptions.length >= 2 ? ruleOptions[1] : Infinity
        
        const ok = value >= min && value <= max
        if(!ok) {
            let error = `${field} should >= ${min}`
            if(max !== Infinity) error += ` and <= ${max}`
            return error
        }
    }

    if(ruleName === 'match'){
        if(!(typeof ruleOptions === 'string' && ruleOptions.length)) {
            return `config error: ${field}#match must be a string`
        }

        try {
            const partten = new RegExp(ruleOptions)
            const ok = partten.test(value)
            if(!ok){
                return `${field} had invalid format`
            }
        } catch (error) {
            return error
        }
    }

    if(ruleName === 'exists') {
        // todo
    }

    return null
}

/**
 * @param {Array} fields fields of data
 * @param {Array} allow_fields  fields of validator config
 * @return {String | null} error
 */
function isAllowedFields(fields , allow_fields) {
    for(let fd of fields){
        if(!allow_fields.includes(fd))
            return `the field '${fd}' is NOT allowed]`
    }
    return null
}

module.exports = DataHandler