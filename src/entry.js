const Ruler = require('./ruler')
const Accessor = require('./accessor')

class Entry {
  constructor ({ db, ruler, accessor }) {
    this._ruler = ruler || new Ruler(this)
    this._accessor = accessor || new Accessor(this, db)
    this._accessor.init()
    this.init()
  }

  init () {
  }

  get db(){
    return this._accessor.db
  }

  loadRules (rules) {
    return this._ruler.load(rules)
  }

  async execute ({ collection, action, query, data, options }) {
    return await this._accessor.execute({ collection, action, query, data, options })
  }

  async validate (collection, action, query, data, options, injections) {
    return await this._ruler.validate(collection, action, query, data, options, injections)
  }

  registerValidator (name, handler) {
    this._ruler.registerValidator(name, handler)
  }
}

module.exports = Entry
