const vm = require('vm')

function ConditionHandler(config, {ruler, collection, action, query, data, options, injections}){

    const script = new vm.Script(config)
    const context = {...injections, query, data, options}
    const result = script.runInNewContext(context)
    return result
}

module.exports = ConditionHandler