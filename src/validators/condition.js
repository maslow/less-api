const vm = require('vm')

function ConditionHandler(config, {ruler, collection, action, query, data, options, injections}){
    let result = false
    try {
        const script = new vm.Script(config)
        const context = {...injections, query, data, options}
        result = script.runInNewContext(context)
    } catch (error) {
        return false
    }
    return result
}

module.exports = ConditionHandler