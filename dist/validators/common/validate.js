"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const $ = require("validator");
const RULE_KEYS = [
    'required', 'in', 'default',
    'length', 'number', 'unique',
    'match', 'exists'
];
async function validateField(field, data, rules, accessor, collection) {
    if (typeof rules !== 'object') {
        return `config error: [${field}]'s rules must be an object`;
    }
    const isRequired = rules['required'] == true;
    if (data[field] === undefined || data[field] === null) {
        if (rules['default'] !== undefined && rules['default'] !== null) {
            data[field] = rules['default'];
        }
        else {
            return isRequired ? `${field} is required` : null;
        }
    }
    const rule_names = Object.keys(rules)
        .filter(name => ['required', 'default'].includes(name) == false);
    for (let name of rule_names) {
        const options = rules[name];
        const error = await _validate(name, options, field, data, accessor, collection);
        if (error)
            return error;
    }
    return null;
}
exports.validateField = validateField;
async function _validate(ruleName, ruleOptions, field, data, accessor, collection) {
    if (!RULE_KEYS.includes(ruleName)) {
        return `config error: unknown rule [${name}]`;
    }
    const value = data[field];
    if (ruleName === 'in') {
        if (!(ruleOptions instanceof Array)) {
            return `config error: ${field}#in must be an array`;
        }
        if (!ruleOptions.includes(value)) {
            return `invalid ${field}`;
        }
    }
    if (ruleName === 'length') {
        if (!(ruleOptions instanceof Array && ruleOptions.length)) {
            return `config error: ${field}#length must be an array with 1-2 integer element, ex. [3, 10]`;
        }
        const min = ruleOptions[0];
        const max = ruleOptions.length >= 2 ? ruleOptions[1] : undefined;
        const ok = $.isLength(value, min, max);
        if (!ok) {
            let error = `length of ${field} should >= ${min}`;
            if (max !== undefined)
                error += ` and <= ${max}`;
            return error;
        }
    }
    if (ruleName === 'number') {
        if (!(ruleOptions instanceof Array && ruleOptions.length)) {
            return `config error: ${field}#number must be an array with 1-2 integer element, ex. [3, 10]`;
        }
        const min = ruleOptions[0];
        const max = ruleOptions.length >= 2 ? ruleOptions[1] : Infinity;
        const ok = value >= min && value <= max;
        if (!ok) {
            let error = `${field} should >= ${min}`;
            if (max !== Infinity)
                error += ` and <= ${max}`;
            return error;
        }
    }
    if (ruleName === 'match') {
        if (!(typeof ruleOptions === 'string' && ruleOptions.length)) {
            return `config error: ${field}#match must be a string`;
        }
        try {
            const partten = new RegExp(ruleOptions);
            const ok = partten.test(value);
            if (!ok) {
                return `${field} had invalid format`;
            }
        }
        catch (error) {
            return error;
        }
    }
    if (ruleName === 'exists') {
        if (!(typeof ruleOptions === 'string' && ruleOptions.length)) {
            return `config error: ${field}#exists must be a string`;
        }
        const arr = ruleOptions.split('/');
        if (arr.length !== 3) {
            return `config error: invalid config of ${field}#exists`;
        }
        const collName = arr[1];
        const key = arr[2];
        const ret = accessor.get(collName, { [key]: value });
        if (!ret)
            return `${field} not exists`;
    }
    if (ruleName === 'unique' && ruleOptions) {
        const ret = accessor.get(collection, { [field]: value });
        if (ret)
            return `${field} exists`;
    }
    return null;
}
function isAllowedFields(fields, allow_fields) {
    for (let fd of fields) {
        if (!allow_fields.includes(fd))
            return `the field '${fd}' is NOT allowed]`;
    }
    return null;
}
exports.isAllowedFields = isAllowedFields;
