const assert = require('assert')
const MongoClient = require('mongodb').MongoClient
const { actions } = require('./types')

/**
 * @see https://mongodb.github.io/node-mongodb-native/3.3/reference/connecting/connection-settings/
 */
class Accessor {
    constructor({ dbName, url, connSettings }) {
        assert.ok(dbName, 'invalid dbName')
        assert.ok(url, 'invalid url')

        this._dbName = dbName
        this._conn = new MongoClient(url, connSettings || {})
        this._db = null
    }

    get db() {
        return this._db
    }
    
    async init() {
        await this._conn.connect()
        this._db = this._conn.db(this._dbName)
        return
    }

    async execute(params){
        const { collection, action } = params

        if(action === actions.READ) {
            return await this._read(collection, params)
        }

        if(action === actions.UPDATE) {
            return await this._update(collection, params)
        }

        if(action === actions.ADD) {
            return await this._add(collection, params)
        }

        if(action === actions.REMOVE) {
            return await this._remove(collection, params)
        }

        throw new Error(`invalid 'action': ${action}`)
    }

    async _read(collection, params){
        const coll = this.db.collection(collection)
        // todo multi
        let { query, order, offset, limit, projection, multi} = params
        query = query || {}
        let options = {}
        if(order) options.sort = this._preprocessSort(order)
        if(offset) options.skip = offset
        if(projection) options.projection = projection

        if(!limit){
            options.limit = 100
        }else{
            options.limit = limit > 100 ? 100 : limit
        }
        
        const docs = await coll.find(query, options).toArray()
        return docs
    }

    async _update(collection, params){
        const coll = this.db.collection(collection)
        // todo merge
        let { query, data, multi, upsert, merge} = params
        query = query || {}
        data = data || {}
        let options = {}
        if(upsert) options.upsert = upsert
        if(multi){
            return await coll.updateOne(query, data, options)
        }else{
            options.upsert = false
            return await coll.updateMany(query, data, options)
        }
    }

    async _add(collection, params){
        const coll = this.db.collection(collection)
        // todo multi
        let { data, multi } = params
        data = data || {}
        return await coll.insertOne(data)
    }

    async _remove(collection, params){
        const coll = this.db.collection(collection)
        let { query, multi } = params
        query = query || {}
        return await coll.deleteOne(query)
    }

    _preprocessSort(order) {
        if(!(order instanceof Array))
            return undefined
        return order.map(od => {
            let dir = od.direction === 'desc' ? -1 : 1
            return [od.field, dir]
        })
    }
}

module.exports = Accessor