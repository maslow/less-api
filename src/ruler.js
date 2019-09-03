const assert = require('assert')
const buildinValidators = require('./validators')

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
    this._rules = rules
    return true
  }

  async validate (collection, action, query, data, options, injections) {
    if (!this.collections.includes(collection)) return false

    if (!Object.keys(actionMaps).includes(action)) return false

    const permission = actionMaps[action]
    let rules = this._rules[collection][permission]
    if (!rules) return false

    if ([true, false].includes(rules)) {
        return { condition: rules }
    }

    // 默认使用 condition validator
    if (typeof rules === 'string') rules = [{ condition: rules }]

    if (!(rules instanceof Array)) rules = [rules]

    // matching rules
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
    for (let rule of rules) {
      let result = false
      for (let name in rule) {
        result = await this.callValidator(name, rule[name], context)
        if (!result) break
      }

      if (result) {
        matched = rule
        break
      }
    }
    if (!matched) return false
    return matched
  }

  async callValidator (name, config, context) {
    return await this._validators[name](config, context)
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
