const assert = require('assert')
const util = require('util')
const buildinValidators = require('./validators')
const Processor = require('./processor')

const actionMaps = {
  'database.queryDocument': '.read',
  'database.updateDocument': '.update',
  'database.addDocument': '.add',
  'database.deleteDocument': '.remove'
}

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
            const config = rule[name]
            _rule[name] = new Processor(name, handler, config, 'validator')
        }
        return _rule
    })

    return data
  }

  async validate (collection, action, query, data, options, injections) {
    if (!this.collections.includes(collection)) return false

    if (!Object.keys(actionMaps).includes(action)) return false

    const permissionName = actionMaps[action]
    const prules = this._rules[collection][permissionName]

    if (!prules) return false

    // matching permission rules
    const context = {
        ruler: this,
        collection,
        action,
        query,
        data,
        options,
        injections
    }

    let matched = null
    for (let validtrs of prules) {
      let result = false
      for (let vname in validtrs) {
        result = await validtrs[vname].run(context)
        if (!result) break
      }

      if (result) {
        matched = validtrs
        break
      }
    }
    if (!matched) return false
    return matched
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
