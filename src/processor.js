

const assert = require('assert')

const types = {
    VALIDATOR: 'validator'
}

class Processor {
    constructor(name, handler, config, type = types.VALIDATOR){
        assert.ok(name, "invalid 'name'")
        assert.ok(handler instanceof Function, "'handler' must be callable")
        assert.ok(config, "invalid 'config'")
        assert.ok(Object.values(types).includes(type), "invalid 'type'")

        this._name = name
        this._handler = handler
        
        this._type = type
        this._config = config
    }

    get types() {
        return types
    }

    get name(){
        return this._name
    }

    get type() {
        return this._type
    }

    async run() {
        return await this._handler.call(this, this._config, ...arguments)
    }
}

module.exports = Processor