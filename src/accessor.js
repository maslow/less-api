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
        assert.ok(Object.keys(actions).includes(action), "invalid 'action'")

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
    }

    async _read(collection, params){
        const coll = this.db.collection(collection)
        return await coll.find() // todo
    }

    async _update(collection, params){
        const coll = this.db.collection(collection)
        return await coll.update() // todo
    }

    async _add(collection, params){
        const coll = this.db.collection(collection)
        return await coll.insert()  // todo
    }

    async _remove(collection, params){
        const coll = this.db.collection(collection)
        return await coll.remove()  // todo
    }
}

module.exports = Accessor