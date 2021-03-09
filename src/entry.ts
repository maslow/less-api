import { Handler } from './processor'
import { Ruler } from './ruler'
import { AccessorInterface } from './accessor/accessor'
import { Params, ActionType, getAction } from "./types"
import assert = require('assert')

export class Entry {

  accessor: AccessorInterface
  ruler: Ruler

  constructor(accessor: AccessorInterface, ruler?: Ruler) {
    this.ruler = ruler || new Ruler(this)
    this.accessor = accessor
  }

  async init() {
    await this.accessor.init()
  }

  async setAccessor(accessor: AccessorInterface) {
    this.accessor = accessor
    await this.init()
  }

  async setRuler(ruler: Ruler) {
    this.ruler = ruler
  }

  loadRules(rules: object): boolean {
    return this.ruler.load(rules)
  }

  async execute(params: Params) {
    assert(this.accessor, 'accessor not configured for Entry')
    return await this.accessor.execute(params)
  }

  async validate(params: Params, injections: object) {
    return await this.ruler.validate(params, injections)
  }

  registerValidator(name: string, handler: Handler) {
    this.ruler.register(name, handler)
  }

  parseParams(reqParams: any): Params {
    const { action } = reqParams
    return Entry.parse(action, reqParams)
  }

  static parse(actionType: ActionType, reqParams: any): Params {
    const { collectionName: collection } = reqParams

    let params: Params = { action: actionType, collection }
    let action = getAction(actionType)
    if (!action) {
      throw new Error(`unknown action: ${actionType}`)
    }

    // copy the params
    action.fields.forEach(field => {
      if (reqParams[field]) params[field] = reqParams[field]
    })

    return params
  }
}
