const assert = require('assert')
const util = require('util')
const buildinValidators = require('./validators')
const Processor = require('./processor')
const { actionMap } = require('./types')

class Ruler {
  constructor (entry) {
    this._entry = entry
    this._validators = {}
    this._rules = null
    this.init()
  }

  init () {
    this._loadBuiltinValidators()
  }

  get collections () {
    if (!this._rules) return []
    return Object.keys(this._rules)
  }

  get db() {
    return this._entry ? this._entry.db : null
  }

  load (rules) {
    assert.equal(typeof rules, 'object', "invalid 'rules'")

    const data = {}
    for(let collection in rules) {
        const permissions = rules[collection]        // permissions is an object, like { ".read": ..., '.update': ... }
        data[collection] = {}
        Object.keys(permissions).forEach(pn => {
            data[collection][pn] = this._instantiateValidators(permissions[pn])
        })
    }
    this._rules = data
    return true
  }

  _instantiateValidators(permissionRules){
    assert.notEqual(permissionRules, undefined, 'permissionRules is undefined')
    let rules = permissionRules

    if ([true, false].includes(rules)) {
        rules = [{ condition: `${rules}` }]
    }

    // 默认使用 condition validator
    if (typeof rules === 'string') rules = [{ condition: rules }]

    if (!(rules instanceof Array)) rules = [rules]

    const data = rules.map(rule => {
        const _rule = {}
        for (let name in rule) {
            const handler = this._validators[name]
            if(!handler){
              throw new Error(`unknown validator '${name}' in your rules`)
            }
            const config = rule[name]
            _rule[name] = new Processor(name, handler, config, 'validator')
        }
        return _rule
    })

    return data
  }

  async validate (params) {
    const { collection, action } = params

    let errors = []
    if (!this.collections.includes(collection)) {
      const err =  { type: 0, error: `collection "${collection}" not found`}
      errors.push(err)
      return [errors]
    }

    if (!Object.keys(actionMap).includes(action)) {
      const err =  { type: 0, error: `action "${action}" invalid`}
      errors.push(err)
      return [errors]
    }

    const permissionName = actionMap[action]
    const prules = this._rules[collection][permissionName]

    
    if (!prules) {
      const err =  { type: 0, error: `${collection} ${action} don't has any rules`}
      errors.push(err)
      return [errors]
    }

    // matching permission rules
    const context = {ruler: this, ...params }

    let matched = null
    for (let validtrs of prules) {
      let error = null
      for (let vname in validtrs) {
        error = await validtrs[vname].run(context)
        if (error) {
          error = {type: vname, error}
          break
        }
      }

      if(error) errors.push(error)

      if (!error) {
        matched = validtrs
        break
      }
    }
    if (!matched) return [errors]
    return [null, matched]
  }


  registerValidator (name, handler) {
    assert.ok(name, `register error: name must not be empty`)
    assert.ok(handler instanceof Function, `${name} register error: 'handler' must be a callable function`)

    const exists = Object.keys(this._validators).filter(vn => vn === name)
    assert.ok(!exists.length, `validator's name: '${name}' duplicated`)

    this._validators[name] = handler
  }

  _loadBuiltinValidators () {
    for (let name in buildinValidators) {
      this.registerValidator(name, buildinValidators[name])
    }
  }
}

module.exports = Ruler
