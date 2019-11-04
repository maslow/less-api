"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
var ProcessTypes;
(function (ProcessTypes) {
    ProcessTypes["Validator"] = "validator";
})(ProcessTypes = exports.ProcessTypes || (exports.ProcessTypes = {}));
class Processor {
    constructor(name, handler, config, type = ProcessTypes.Validator) {
        assert.ok(handler instanceof Function, `${name}'s handler must be callable`);
        this.name = name;
        this.handler = handler;
        this.type = type;
        this.config = config;
    }
    async run(context) {
        return await this.handler.call(this, this.config, context);
    }
}
exports.Processor = Processor;
