
const Ruler = require('./ruler')
const Accessor = require('./accessor')
const { acceptParams, actions } = require('./types')

class Entry {
  constructor ({ db, ruler, accessor }) {
    this._ruler = ruler || new Ruler(this)
    this._accessor = accessor || new Accessor(db)
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

  async execute (params) {
    const { action } = params
    const result = await this._accessor.execute(params)
    
    let data = {}

    if(action === actions.READ) {
      data = { list: result }
    }

    if(action === actions.UPDATE) {
      data = {
        upsert_id: result.upsertedId,
        updated: result.modifiedCount,
        matched: result.matchedCount
      }
    }

    if(action === actions.ADD){
      data = {
        _id: result.insertedIds || result.insertedId,
        insertedCount: result.insertedCount
      }
    }

    if(action === actions.REMOVE) {
      data = { deleted: result.deletedCount }
    }

    if(action === actions.COUNT) {
      data = { count: result }
    }

    return data
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
