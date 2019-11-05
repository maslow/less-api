
import * as assert from 'assert'
import { Entry } from './entry'
import { Params, PermissionType, getAction } from './types'
import { Handler, Processor, HandlerContext } from './processor'
import * as buildinValidators from './validators'
import { AccessorInterface } from './accessor'

interface ValidatorCollection {
  [name: string]: Handler
}

interface InternalRuleTable {
  [name: string]: Processor
}

type InternalPermissions = {
  [permission in PermissionType]: InternalRuleTable[];
}

interface InternalRules {
  [collection: string]: InternalPermissions
}


export interface ValidateError {
  type: string | number,
  error: string | object
}

export interface ValidateResult {
  errors?: ValidateError[],
  matched?: InternalRuleTable
}

export class Ruler {

  private readonly entry: Entry
  readonly validators: ValidatorCollection
  private rules: InternalRules

  constructor(entry: Entry) {
    this.entry = entry
    this.validators = {}
    this.rules = null
    this.init()
  }

  init() {
    this.loadBuiltins()
  }

  get collections() {
    if (!this.rules) return []
    return Object.keys(this.rules)
  }

  get accessor(): AccessorInterface {
    return this.entry ? this.entry.accessor : null
  }

  load(rules: any) {
    assert.equal(typeof rules, 'object', "invalid 'rules'")

    const internalRules = {} as InternalRules
    for (let collection in rules) {
      const permissions = rules[collection]        // permissions is an object, like { ".read": ..., '.update': ... }
      internalRules[collection] = {} as InternalPermissions
      Object.keys(permissions).forEach(pn => {
        internalRules[collection][pn] = this.instantiateValidators(permissions[pn])
      })
    }
    this.rules = internalRules
    return true
  }

  private instantiateValidators(permissionRules: any) {
    assert.notEqual(permissionRules, undefined, 'permissionRules is undefined')

    let rules = permissionRules
    if ([true, false].includes(rules)) {
      rules = [{ condition: `${rules}` }]
    }

    // use condition validator by default
    if (typeof rules === 'string') rules = [{ condition: rules }]

    if (!(rules instanceof Array)) rules = [rules]

    const data: InternalRuleTable[] = rules.map(raw_rule => {
      const rule: InternalRuleTable = {}
      for (let name in raw_rule) {
        const handler = this.validators[name]
        if (!handler) {
          throw new Error(`unknown validator '${name}' in your rules`)
        }
        const config = raw_rule[name]
        rule[name] = new Processor(name, handler, config)
      }
      return rule
    })

    return data
  }

  async validate(params: Params, injections: object): Promise<ValidateResult> {
    const { collection, action: actionType } = params

    let errors: ValidateError[] = []
    if (!this.collections.includes(collection)) {
      const err: ValidateError = { type: 0, error: `collection "${collection}" not found` }
      errors.push(err)
      return { errors }
    }


    const action = getAction(actionType)
    if (!action) {
      const err: ValidateError = { type: 0, error: `action "${actionType}" invalid` }
      errors.push(err)
      return { errors }
    }

    const permissionName = action.permission
    const permRuleTables: InternalRuleTable[] = this.rules[collection][permissionName]


    if (!permRuleTables) {
      const err: ValidateError = { type: 0, error: `${collection} ${actionType} don't has any rules` }
      errors.push(err)
      return { errors }
    }

    // matching permission rules
    const context: HandlerContext = { ruler: this, params, injections }

    let matched = null
    for (let validtrs of permRuleTables) {
      let error: ValidateError = null
      for (let vname in validtrs) {
        let result = await validtrs[vname].run(context)
        if (result) {
          error = { type: vname, error: result }
          break
        }
      }

      if (error) errors.push(error)

      if (!error) {
        matched = validtrs
        break
      }
    }
    if (!matched) return { errors }
    return { matched }
  }


  register(name: string, handler: Handler) {
    assert.ok(name, `register error: name must not be empty`)
    assert.ok(handler instanceof Function, `${name} register error: 'handler' must be a callable function`)

    const exists = Object.keys(this.validators).filter(vn => vn === name)
    assert.ok(!exists.length, `validator's name: '${name}' duplicated`)

    this.validators[name] = handler
  }

  private loadBuiltins() {
    for (let name in buildinValidators) {
      this.register(name, buildinValidators[name] as Handler)
    }
  }
}