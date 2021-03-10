
import * as $ from 'validator'
import * as vm from 'vm'
import { HandlerContext } from '../../processor'

const RULE_KEYS = [
    'required', 'in', 'default',
    'length', 'number', 'unique',
    'match', 'exists', 'condition'
]


export async function validateField(field: string, query: any, configRule: any, context: HandlerContext) {
    if (typeof configRule === 'string') {
        configRule = { condition: configRule }
    }

    if (typeof configRule !== 'object') {
        return `config error: [${field}]'s rules must be an object`
    }

    // if required == true
    const isRequired = configRule['required'] == true
    if (query[field] === undefined || query[field] === null) {
        // if default
        if (configRule['default'] !== undefined && configRule['default'] !== null) {
            query[field] = query[field] = configRule['default']
        } else {
            return isRequired ? `${field} is required` : null
        }
    }

    const rule_names = Object.keys(configRule)
        .filter(name => ['required', 'default'].includes(name) == false)

    for (let name of rule_names) {
        const options = configRule[name]
        const error = await validate(name, options, field, query, context)
        if (error) return error
    }

    return null
}

async function validate(ruleName: string, ruleOptions: any, field: string, query: any, context: HandlerContext) {
    if (!RULE_KEYS.includes(ruleName)) {
        return `config error: unknown rule [${ruleName}]`
    }

    const value = query[field]

    if (ruleName === 'condition') {
        const script = new vm.Script(ruleOptions)
        const { injections } = context

        const global = { ...injections, $value: value }
        const result = script.runInNewContext(global)
        if (!result) return `condition evaluted to false`
    }

    if (ruleName === 'in') {
        if (!(ruleOptions instanceof Array)) {
            return `config error: ${field}#in must be an array`
        }

        if (!ruleOptions.includes(value)) {
            const str = ruleOptions.join(',')
            return `${field} should equal to one of [${str}]`
        }
    }

    if (ruleName === 'length') {
        if (!(ruleOptions instanceof Array && ruleOptions.length)) {
            return `config error: ${field}#length must be an array with 1-2 integer element, ex. [3, 10]`
        }

        const min = ruleOptions[0]
        const max = ruleOptions.length >= 2 ? ruleOptions[1] : undefined
        const ok = $.isLength(value, min, max)
        if (!ok) {
            let error = `length of ${field} should >= ${min}`
            if (max !== undefined) error += ` and <= ${max}`
            return error
        }
    }

    if (ruleName === 'number') {
        if (!(ruleOptions instanceof Array && ruleOptions.length)) {
            return `config error: ${field}#number must be an array with 1-2 integer element, ex. [3, 10]`
        }

        const min = ruleOptions[0]
        const max = ruleOptions.length >= 2 ? ruleOptions[1] : Infinity

        const ok = value >= min && value <= max
        if (!ok) {
            let error = `${field} should >= ${min}`
            if (max !== Infinity) error += ` and <= ${max}`
            return error
        }
    }

    if (ruleName === 'match') {
        if (!(typeof ruleOptions === 'string' && ruleOptions.length)) {
            return `config error: ${field}#match must be a string`
        }

        try {
            const partten = new RegExp(ruleOptions)
            const ok = partten.test(value)
            if (!ok) {
                return `${field} had invalid format`
            }
        } catch (error) {
            return error
        }
    }

    // {"exists": "/users/id"},
    if (ruleName === 'exists') {
        if (!(typeof ruleOptions === 'string' && ruleOptions.length)) {
            return `config error: ${field}#exists must be a string`
        }

        const arr = ruleOptions.split('/')
        if (arr.length !== 3) {
            return `config error: invalid config of ${field}#exists`
        }
        const accessor = context.ruler.accessor
        const collName = arr[1]
        const key = arr[2]
        const ret = await accessor.get(collName, { [key]: value })
        if (!ret) return `${field} not exists`
    }

    if (ruleName === 'unique' && ruleOptions) {
        const accessor = context.ruler.accessor
        const collection = context.params.collection
        const ret = await accessor.get(collection, { [field]: value })
        if (ret) return `${field} already exists`
    }

    return null
}