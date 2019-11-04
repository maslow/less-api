"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ruler_1 = require("./ruler");
const types_1 = require("./types");
class Entry {
    constructor(accessor, ruler) {
        this.ruler = ruler || new ruler_1.Ruler(this);
        this.accessor = accessor;
    }
    async init() {
        await this.accessor.init();
    }
    loadRules(rules) {
        return this.ruler.load(rules);
    }
    async execute(params) {
        return await this.accessor.execute(params);
    }
    async validate(params, injections) {
        return await this.ruler.validate(params, injections);
    }
    registerValidator(name, handler) {
        this.ruler.register(name, handler);
    }
    parseParams(actionType, reqParams) {
        const { collectionName: collection } = reqParams;
        let params = { action: actionType, collection };
        let action = types_1.getAction(actionType);
        if (!action) {
            throw new Error(`unknown action: ${actionType}`);
        }
        action.fields.forEach(field => {
            if (reqParams[field])
                params[field] = reqParams[field];
        });
        return params;
    }
}
exports.Entry = Entry;
