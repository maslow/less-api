import * as vm from 'vm'
import { Handler } from '../processor'

export const ConditionHandler: Handler = function (config, context) {
  try {
    let script = this._script
    if (!script) {
      script = new vm.Script(config)
      this._script = script
    }
    const { injections, params } =  context
    
    const global = { ...injections, ...params }

    const result = script.runInNewContext(global)
    if(result) return null

    return 'the expression evaluated to a falsy value'
  } catch (error) {
    return error
  }
}