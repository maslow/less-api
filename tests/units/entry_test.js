const assert = require('assert')
const { Entry, Ruler, Accessor } = require('../../src/index')

describe('class Entry', () => {
  it('constructor() ok', () => {
    const db = { dbName: 'test', url: 'test-url' }
    const entry = new Entry({ db })
    assert.ok(entry._ruler instanceof Ruler)
    assert.ok(entry._accessor instanceof Accessor)
  })

  it('parseParams() ok', () => {
    const db = { dbName: 'test', url: 'test-url' }
    const entry = new Entry({ db })

    const reqParams = {
      collectionName: 'test-name',
      query: { _id: 'test-id'},
      other: 'test'
    }

    let r = entry.parseParams('database.queryDocument', reqParams)
    assert.equal(r.action, 'database.queryDocument')
    assert.equal(r.collection, 'test-name')
    assert.ok(r.query)
    assert.ok(!r.other)
    assert.equal(r.query._id, 'test-id')

    // unknown action should return empty object
    r = entry.parseParams('database.unknowAction', reqParams)
    assert.ok(typeof r === 'object')
    assert.equal(Object.keys(r).length, 0)
  })
})