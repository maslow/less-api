const vm = require('vm')

function ConditionHandler(params, injections){
    const script = new vm.Script(params)
    const context = {...injections}
    const result = script.runInContext(context)

    return result
}

module.exports = ConditionHandler