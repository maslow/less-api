const assert = require('assert')
const MongoClient = require('mongodb').MongoClient

const actions = {
    READ: 'database.queryDocument',
    UPDATE: 'database.updateDocument',
    ADD: 'database.addDocument',
    REMOVE: 'database.deleteDocument'
}

/**
 * @see https://mongodb.github.io/node-mongodb-native/3.3/reference/connecting/connection-settings/
 */
class Accessor {
    constructor(entry, { dbName, url, connSettings }) {
        assert.ok(dbName, 'invalid dbName')
        this._entry = entry
        this._dbName = dbName

        this._connSettings = connSettings || {}
        this._conn = new MongoClient(url, this._connSettings)
        this._db = null
        this.init()
    }

    get db() {
        return this._db
    }
    
    async init() {
        await this._conn.connect()
        this._db = this._conn.db(this._dbName)
        return
    }

    async execute({ collection, action, query, data, options }){
        assert.ok(Object.keys(actions).includes(action), "invalid 'action'")

        if(action === actions.READ) {
            return await this._read(collection, query, options)
        }

        if(action === actions.UPDATE) {
            return await this._update(collection, query, data, options)
        }

        if(action === actions.ADD) {
            return await this._add(collection, data, options)
        }

        if(action === actions.REMOVE) {
            return await this._remove(collection, query, options)
        }
    }

    async _read(collection, query, options){
        const coll = this.db.collection(collection)
        return await coll.find(query, options)
    }

    async _update(collection, query, data, options){
        const coll = this.db.collection(collection)
        return await coll.update(query, data, options)
    }

    async _add(collection, data, options){
        const coll = this.db.collection(collection)
        return await coll.insert(data, options)
    }

    async _remove(collection, query, options){
        const coll = this.db.collection(collection)
        return await coll.remove(query, options)
    }
}

module.exports = Accessor