import { Handler } from './processor'
import { Ruler as RulerV1 } from './ruler/ruler_v1'
import { AccessorInterface } from './accessor/accessor'
import { Params, ActionType, getAction } from "./types"
import assert = require('assert')
import { DefaultLogger, LoggerInterface } from './logger'
import { RulerInterface } from './ruler'

export class Entry {

  private _accessor: AccessorInterface
  private _ruler: RulerInterface
  private _logger: LoggerInterface

  constructor(accessor: AccessorInterface, ruler: RulerInterface) {
    if (!ruler) {
      this.logger.warn(`
       You have passed a empty ruler to Entry.constructor() which will be depracated in the future.
       Please give a instant of Ruler explicitly, otherwise entry will use an old Ruler automatically (RulerV1)
      `)
    }
    this._ruler = ruler || new RulerV1(this)
    this._accessor = accessor
  }

  get logger(): LoggerInterface {
    if (!this._logger) {
      this._logger = new DefaultLogger()
    }
    return this._logger
  }

  setLogger(logger: LoggerInterface) {
    this._logger = logger
  }

  get accessor(): AccessorInterface {
    assert(this._accessor, 'Entry: accessor is empty')
    return this._accessor
  }

  async setAccessor(accessor: AccessorInterface) {
    this.logger.info(`change entry's accessor: ` + accessor.type)
    this._accessor = accessor
    await this.init()
  }

  get ruler(): RulerInterface {
    return this._ruler
  }

  /**
   * set ruler
   * @param ruler 
   */
  async setRuler(ruler: RulerInterface) {
    this.logger.info(`change entry's ruler`)
    this._ruler = ruler
  }

  /**
   * @deprecated Entry.init() will be deprecated in future, you should call accessor.init() directly instead
   */
  async init() {
    this.logger.warn('Entry.init() will be deprecated in future, you should call accessor.init() directly instead')
    if (this._accessor.type === 'mongo') {
      await (this._accessor as any).init()
    }
  }

  /**
   * load rules to ruler from json object
   * @deprecated this method will be deprecated in future, use `Ruler.load()` `Ruler.add()` `Ruler.set()` instead
   * @param rules 
   * @returns 
   */
  loadRules(rules: object): boolean {
    this.logger.warn('@deprecated: Entry.loadRules() will be deprecated in future, use `Ruler.load()` `Ruler.add()` `Ruler.set()` instead')
    this.logger.info(`entry loading rules`)
    return this.ruler.load(rules)
  }

  /**
   * perform data request
   * @param params 
   * @returns 
   */
  async execute(params: Params) {
    const { requestId } = params
    this.logger.info(`[${requestId}] entry before executing`)
    assert(this.accessor, 'accessor not configured for Entry')
    return await this.accessor.execute(params)
  }

  /**
   * perform validation on request
   * @param params 
   * @param injections 
   * @returns 
   */
  async validate(params: Params, injections: object) {
    const { requestId } = params
    this.logger.info(`[${requestId}] entry validating`)
    return await this.ruler.validate(params, injections)
  }

  /**
   * Register a Ruler validator
   * @deprecated this method will be deprecated in future, use `Ruler.register()` instead
   * @param name 
   * @param handler 
   */
  registerValidator(name: string, handler: Handler) {
    this.logger.warn("@deprecated: Entry.registerValidator() will be deprecated in future, use `Ruler.register()` instead")
    this.logger.info(`entry registerValidator: ${name}`)
    this.ruler.register(name, handler)
  }

  /**
   * Parse request params
   * @param reqParams req.body
   * @returns 
   */
  parseParams(reqParams: any): Params {
    const { action, requestId } = reqParams
    this.logger.info(`[${requestId}] params parsing`)
    const result = Entry.parse(action, reqParams)
    this.logger.debug(`[${requestId}] params parsed: `, JSON.stringify(result))
    return result
  }

  /**
   * Parse request params
   * @param actionType 
   * @param reqParams 
   * @returns 
   */
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
