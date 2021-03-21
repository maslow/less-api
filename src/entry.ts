import { Handler } from './processor'
import { Ruler } from './ruler'
import { AccessorInterface } from './accessor/accessor'
import { Params, ActionType, getAction } from "./types"
import assert = require('assert')
import { DefaultLogger, LoggerInterface } from './logger'

export class Entry {

  accessor: AccessorInterface
  ruler: Ruler
  logger: LoggerInterface

  constructor(accessor: AccessorInterface, ruler?: Ruler) {
    this.ruler = ruler || new Ruler(this)
    this.accessor = accessor
    this.logger = new DefaultLogger()
  }

  async init() {
    this.logger.info(`entry initializing`)
    await this.accessor.init(this)
    this.logger.info(`entry accessor initialized`)
  }

  async setAccessor(accessor: AccessorInterface) {
    this.logger.info(`change entry's accessor: ` + accessor.type)
    this.accessor = accessor
    await this.init()
  }

  setLogger(logger: LoggerInterface) {
    this.logger = logger
  }

  getLogger(): LoggerInterface {
    return this.logger
  }

  async setRuler(ruler: Ruler) {
    this.logger.info(`change entry's ruler`)
    this.ruler = ruler
  }

  loadRules(rules: object): boolean {
    this.logger.info(`entry loading rules`)
    return this.ruler.load(rules)
  }

  async execute(params: Params) {
    const { requestId } = params
    this.logger.info(`[${requestId}] entry before executing`)
    assert(this.accessor, 'accessor not configured for Entry')
    return await this.accessor.execute(params)
  }

  async validate(params: Params, injections: object) {
    const { requestId } = params
    this.logger.info(`[${requestId}] entry validating`)
    return await this.ruler.validate(params, injections)
  }

  registerValidator(name: string, handler: Handler) {
    this.logger.info(`entry registerValidator: ${name}`)
    this.ruler.register(name, handler)
  }

  parseParams(reqParams: any): Params {
    const { action, requestId } = reqParams
    this.logger.info(`[${requestId}] params parsing`)
    const result = Entry.parse(action, reqParams)
    this.logger.debug(`[${requestId}] params parsed: `, JSON.stringify(result))
    return result
  }

  static parse(actionType: ActionType, reqParams: any): Params {
    const { collectionName: collection, requestId } = reqParams

    let params: Params = { action: actionType, collection, requestId }
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
