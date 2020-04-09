
import * as $ from 'validator'
import * as vm from 'vm'
import { HandlerContext } from '../../processor'
import { UPDATE_COMMANDS } from "../../types"


const RULE_KEYS = [
    'required', 'in', 'default',
    'length', 'number', 'unique',
    'match', 'exists', 'condition'
]


export async function validateField(field: string, data: any, rules: any, context: HandlerContext) {
    if(typeof rules === 'string'){
        rules = { condition: rules }
    }

    if(typeof rules !== 'object') {
        return `config error: [${field}]'s rules must be an object`
    }

    const flatten = flattenData(data)

    // if required == true
    const isRequired = rules['required'] == true
    if(flatten[field] === undefined || flatten[field] === null) {
        // if default
        if(rules['default'] !== undefined && rules['default'] !== null) {
            flatten[field] = data[field] = rules['default']
        }else{
            return isRequired ? `${field} is required` : null
        }
    }

    const rule_names = Object.keys(rules)
        .filter(name => ['required', 'default'].includes(name) == false)

    for(let name of rule_names) {
        const options = rules[name]
        const error = await _validate(name, options, field, flatten, context)
        if(error) return error
    }

    return null
}

async function _validate(ruleName: string, ruleOptions: any, field: string, data: any, context: HandlerContext) {
    if(!RULE_KEYS.includes(ruleName)){
        return `config error: unknown rule [${ruleName}]`
    }

    const value = data[field]

    if(ruleName === 'condition'){
        const script = new vm.Script(ruleOptions)
        const { injections } =  context
    
        const global = { ...injections, $value: value }
        const result = script.runInNewContext(global)
        if(!result) return `condition evaluted to false`
    }

    if(ruleName === 'in') {
        if(!(ruleOptions instanceof Array)) {
            return `config error: ${field}#in must be an array`
        }

        if(!ruleOptions.includes(value)){
            const str = ruleOptions.join(',')
            return `${field} should equal to one of [${str}]`
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
        if(!(typeof ruleOptions === 'string' && ruleOptions.length)) {
            return `config error: ${field}#exists must be a string`
        }

        const arr = ruleOptions.split('/')
        if(arr.length !== 3){
            return `config error: invalid config of ${field}#exists`
        }
        const accessor = context.ruler.accessor
        const collName = arr[1]
        const key = arr[2]
        const ret = accessor.get(collName, {[key]: value})
        if(!ret) return `${field} not exists`
    }

    if(ruleName === 'unique' && ruleOptions) {
        const accessor = context.ruler.accessor
        const collection = context.params.collection
        const ret = accessor.get(collection, {[field]: value})
        if(ret) return `${field} exists`
    }

    return null
}


/**
 * 将带操作符的 data 对象平铺
 * 
data: {
    title: '',
    $set: {
        content: '',
        author: 123
    },
    $inc: {
        age: 1
    },
    $push: {
        grades: 99,
    },
}
*/
export function flattenData(data: any = {}): object{
    const arr = Object.values(UPDATE_COMMANDS)
    const operators = new Set<string>(arr)
    const result = {}
    
    for(const key in data) {
        if(!operators.has(key)){
            result[key] = data[key]
            continue
        }

        const obj = data[key]
        for(const k in obj){
            result[k] = obj[k]
        }
    }
    return result
}