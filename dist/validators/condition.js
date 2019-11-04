"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vm = require("vm");
exports.ConditionHandler = function (config, context) {
    try {
        let script = this._script;
        if (!script) {
            script = new vm.Script(config);
            this._script = script;
        }
        const { injections, params } = context;
        const global = Object.assign(Object.assign({}, injections), params);
        const result = script.runInNewContext(global);
        if (result)
            return null;
        return 'the expression evaluated to a falsy value';
    }
    catch (error) {
        return error;
    }
};
