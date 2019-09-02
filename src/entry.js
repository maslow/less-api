const Ruler = require('./ruler')
const Accessor = require('./accessor')

class Entry {
  constructor (config) {
    this._ruler = new Ruler(this)
    this._accessor = new Accessor(this, config)
    this.init()
  }

  init () {
  }

  loadRules (rules) {
    return this._ruler.load(rules)
  }

  async execute (params) {
    return await this._accessor.execute(params)
  }

  async validate (collection, action, query, data, options, injections) {
    return await this._ruler.validate(collection, action, query, data, options, injections)
  }

  registerValidator (name, handler) {
    this._ruler.registerValidator(name, handler)
  }
}

module.exports = Entry
