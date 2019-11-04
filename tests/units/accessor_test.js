const assert = require('assert')
const {  MongoAccessor } = require('../../dist')

const MongoClient = require('mongodb').MongoClient

describe('class Accessor', () => {
    it('constructor() ok', () => {
        const acc = new MongoAccessor('test-db', 'test-url')
        assert.equal(acc.db_name, 'test-db')
        assert.equal(acc.db, null)
        assert.ok(acc.conn instanceof MongoClient)
    })
})