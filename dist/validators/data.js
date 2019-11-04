"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validate_1 = require("./common/validate");
exports.DataHandler = async function (config, context) {
    const { params, ruler } = context;
    const { data, collection } = params;
    if (!data)
        return 'data is undefined';
    if (typeof data !== 'object')
        return 'data must be an object';
    const fields = Object.keys(data);
    let allow_fields = [];
    if (config instanceof Array) {
        allow_fields = config;
        const error = validate_1.isAllowedFields(fields, allow_fields);
        return error;
    }
    if (typeof config === 'object') {
        allow_fields = Object.keys(config);
        let error = validate_1.isAllowedFields(fields, allow_fields);
        if (error)
            return error;
        const accessor = ruler.accessor;
        for (let field of allow_fields) {
            error = await validate_1.validateField(field, data, config[field], accessor, collection);
            if (error)
                return error;
        }
        return null;
    }
    return 'config error: config must be an array or object';
};
