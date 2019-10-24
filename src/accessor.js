const assert = require('assert')
const { MongoClient, ObjectID } = require('mongodb')
const { actions, UPDATE_COMMANDS } = require('./types')

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
        const { collection, action, query } = params
        // 处理 query._id 的类型问题
        if(query && query._id) {
            query._id =  ObjectID(query._id)
        }

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
        return await coll.find(query, options).toArray()
    }

    async _update(collection, params){
        const coll = this.db.collection(collection)

        let { query, data, multi, upsert, merge} = params

        query = query || {}
        data = data || {}

        let options = {}
        if(upsert) options.upsert = upsert

        const OPTRS = Object.values(UPDATE_COMMANDS)

        // process update operators
        if(!merge){
            // check if any operator exists
            let hasOperator = false
            const checkMixed = objs => {
                if (typeof objs !== 'object') return

                for (let key in objs) {
                    if (OPTRS.includes(key)) {
                        hasOperator = true
                    } else if (typeof objs[key] === 'object') {
                        checkMixed(objs[key])
                    }
                }
            }
            checkMixed(data)

            assert.ok(!hasOperator, 'data must not contain any operator while `merge` with false')
            return await coll.replaceOne(query, data, options)
        }

        // add default operator($set) for non-operator-object if merge === true
        for (let key in data) {
            if (OPTRS.includes(key)) 
                continue

            data[UPDATE_COMMANDS.SET] = {
                [key]: data[key]
            }
            delete data[key]
        }

        if(!multi){
            return await coll.updateOne(query, data, options)
        }else{
            options.upsert = false
            return await coll.updateMany(query, data, options)
        }
    }

    async _add(collection, params){
        const coll = this.db.collection(collection)
        let { data, multi } = params
        data = data || {}
        if(!multi){
            return await coll.insertOne(data)
        }else{
            data = data instanceof Array ? data: [data]
            return await coll.insertMany(data)
        }
    }

    async _remove(collection, params){
        const coll = this.db.collection(collection)
        let { query, multi } = params
        query = query || {}
        if(!multi){
            return await coll.deleteOne(query)
        }else{
            return await coll.deleteMany(query)
        }
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