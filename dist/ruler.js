"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const types_1 = require("./types");
const processor_1 = require("./processor");
const buildinValidators = require("./validators");
class Ruler {
    constructor(entry) {
        this.entry = entry;
        this.validators = {};
        this.rules = null;
        this.init();
    }
    init() {
        this.loadBuiltins();
    }
    get collections() {
        if (!this.rules)
            return [];
        return Object.keys(this.rules);
    }
    get accessor() {
        return this.entry ? this.entry.accessor : null;
    }
    load(rules) {
        assert.equal(typeof rules, 'object', "invalid 'rules'");
        const internalRules = {};
        for (let collection in rules) {
            const permissions = rules[collection];
            internalRules[collection] = {};
            Object.keys(permissions).forEach(pn => {
                internalRules[collection][pn] = this.instantiateValidators(permissions[pn]);
            });
        }
        this.rules = internalRules;
        return true;
    }
    instantiateValidators(permissionRules) {
        assert.notEqual(permissionRules, undefined, 'permissionRules is undefined');
        let rules = permissionRules;
        if ([true, false].includes(rules)) {
            rules = [{ condition: `${rules}` }];
        }
        if (typeof rules === 'string')
            rules = [{ condition: rules }];
        if (!(rules instanceof Array))
            rules = [rules];
        const data = rules.map(raw_rule => {
            const rule = {};
            for (let name in raw_rule) {
                const handler = this.validators[name];
                if (!handler) {
                    throw new Error(`unknown validator '${name}' in your rules`);
                }
                const config = raw_rule[name];
                rule[name] = new processor_1.Processor(name, handler, config);
            }
            return rule;
        });
        return data;
    }
    async validate(params, injections) {
        const { collection, action: actionType } = params;
        let errors = [];
        if (!this.collections.includes(collection)) {
            const err = { type: 0, error: `collection "${collection}" not found` };
            errors.push(err);
            return { errors };
        }
        const action = types_1.getAction(actionType);
        if (!action) {
            const err = { type: 0, error: `action "${actionType}" invalid` };
            errors.push(err);
            return { errors };
        }
        const permissionName = action.permission;
        const permRuleTables = this.rules[collection][permissionName];
        if (!permRuleTables) {
            const err = { type: 0, error: `${collection} ${actionType} don't has any rules` };
            errors.push(err);
            return { errors };
        }
        const context = { ruler: this, params, injections };
        let matched = null;
        for (let validtrs of permRuleTables) {
            let error = null;
            for (let vname in validtrs) {
                let result = await validtrs[vname].run(context);
                if (result) {
                    error = { type: vname, error: result };
                    break;
                }
            }
            if (error)
                errors.push(error);
            if (!error) {
                matched = validtrs;
                break;
            }
        }
        if (!matched)
            return { errors };
        return { matched };
    }
    register(name, handler) {
        assert.ok(name, `register error: name must not be empty`);
        assert.ok(handler instanceof Function, `${name} register error: 'handler' must be a callable function`);
        const exists = Object.keys(this.validators).filter(vn => vn === name);
        assert.ok(!exists.length, `validator's name: '${name}' duplicated`);
        this.validators[name] = handler;
    }
    loadBuiltins() {
        for (let name in buildinValidators) {
            this.register(name, buildinValidators[name]);
        }
    }
}
exports.Ruler = Ruler;
