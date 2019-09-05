const vm = require('vm')

function ConditionHandler (config, { ruler, query, data, injections }) {
  try {
    let script = this._script
    if (!script) {
      script = new vm.Script(config)
      this._script = script
    }
    const context = { ...injections, query, data }
    return script.runInNewContext(context)
  } catch (error) {
    return false
  }
}

module.exports = ConditionHandler
