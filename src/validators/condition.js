const vm = require('vm')

function ConditionHandler (
  config,
  { ruler, collection, action, query, data, options, injections }
) {
  try {
    let script = this._script
    if (!script) {
      script = new vm.Script(config)
      this._script = script
    }
    const context = { ...injections, query, data, options }
    return script.runInNewContext(context)
  } catch (error) {
    return false
  }
}

module.exports = ConditionHandler
