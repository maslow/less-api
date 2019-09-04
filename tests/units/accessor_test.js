const assert = require('assert')
const Accessor = require('../../src/accessor')
const MongoClient = require('mongodb').MongoClient

describe('class Accessor', () => {
    it('constructor() ok', () => {
        const db = { dbName: 'testdb', url: 'test-db-url', connSettings: {} }
        const acc = new Accessor(db)
        assert.equal(acc._dbName, db.dbName)
        assert.equal(acc._db, null)
        assert.ok(acc._conn instanceof MongoClient)
    })
})