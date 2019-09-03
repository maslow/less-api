
const Ruler = require('./ruler')
const Accessor = require('./accessor')
const { acceptParams } = require('./types')

class Entry {
  constructor ({ db, ruler, accessor }) {
    this._ruler = ruler || new Ruler(this)
    this._accessor = accessor || new Accessor(this, db)
  }

  async init () {
    await this._accessor.init()
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

  async validate (params) {
    return await this._ruler.validate(params)
  }

  registerValidator (name, handler) {
    this._ruler.registerValidator(name, handler)
  }

  parseParams(action, reqParams) {
    let params = {}

    const fields = acceptParams[action]
    if(!fields) return params

    fields.forEach(fld => {
      if(reqParams[fld]) params[fld] = reqParams[fld]
    })

    return { collection: reqParams.collectionName, action, ...params }
  }
}

module.exports = Entry
