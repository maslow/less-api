const assert = require('assert')
const { Entry } = require('../../src/index')
const { actions } = require('../../src/types')
const ObjectId = require('mongodb').ObjectID

const dbconfig = {
  dbName: 'testdb',
  url: 'mongodb://localhost:27017',
  connSettings: {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
}

const COLL_NAME = 'test_update'
const TEST_DATA = [
  { title: 'title-1', content: 'content-1' },
  { title: 'title-2', content: 'content-2' },
  { title: 'title-3', content: 'content-3' }
]

/**
 *
 * @param {String} coll
 */
async function restoreTestData (coll) {
  await coll.deleteMany({})
  const r = await coll.insertMany(TEST_DATA)
  assert.equal(r.insertedCount, TEST_DATA.length)
}

describe('Database update', function () {
  this.timeout(10000)

  let entry = new Entry({ db: dbconfig })
  let coll = null
  before(async () => {
    await entry.init()

    // insert data
    coll = entry.db.collection(COLL_NAME)
    await restoreTestData(coll)
  })

  it('update one should be ok', async () => {
    await restoreTestData(coll)

    let params = {
      collection: COLL_NAME,
      action: actions.UPDATE,
      query: {
        title: TEST_DATA[0].title
      },
      data: { title: 'title-updated-1' },
      merge: true
    }
    const { result } = await entry.execute(params)

    assert.equal(result.nModified, 1) // modified
    assert.equal(result.n, 1) // matched

    const [updated] = await coll.find().toArray()
    assert.equal(updated.title, 'title-updated-1') // changed
    assert.equal(updated.content, TEST_DATA[0].content) // unchanged
  })

  it('update one with operator [$set] existing in data should be ok', async () => {
    await restoreTestData(coll)

    let params = {
      collection: COLL_NAME,
      action: actions.UPDATE,
      query: {
        title: TEST_DATA[0].title
      },
      data: {
        $set: {
          title: 'title-updated-1'
        }
      },
      merge: true
    }
    const { result } = await entry.execute(params)

    assert.equal(result.nModified, 1) // modified
    assert.equal(result.n, 1) // matched

    const [updated] = await coll.find().toArray()
    assert.equal(updated.title, 'title-updated-1')          // changed
    assert.equal(updated.content, TEST_DATA[0].content)     // unchanged
  })

  it('update one with operator [$push] existing in data should be ok', async () => {
    await restoreTestData(coll)

    let params = {
      collection: COLL_NAME,
      action: actions.UPDATE,
      query: {
        title: TEST_DATA[0].title
      },
      data: {
        title: 'title-updated-1',
        $push: {
            arr: 'item'
        }
      },
      merge: true
    }
    const { result } = await entry.execute(params)

    assert.equal(result.nModified, 1) // modified
    assert.equal(result.n, 1) // matched

    const [updated] = await coll.find().toArray()
    assert.ok(updated.arr instanceof Array)
    assert.equal(updated.arr[0], 'item')
    assert.equal(updated.title, 'title-updated-1')          // changed
    assert.equal(updated.content, TEST_DATA[0].content)     // unchanged
  })

  it('replace one should be ok', async () => {
    await restoreTestData(coll)

    let params = {
      collection: COLL_NAME,
      action: actions.UPDATE,
      query: {
        title: TEST_DATA[0].title
      },
      data: { title: 'title-updated-1' },
      merge: false
    }
    const { result } = await entry.execute(params)

    assert.equal(result.nModified, 1) // modified
    assert.equal(result.n, 1) // matched

    const [updated] = await coll.find().toArray()
    assert.equal(updated.title, 'title-updated-1') // changed
    assert.equal(updated.content, undefined) // replaced
  })

  it('replace one while operator exists in data should throw error', async () => {
    await restoreTestData(coll)

    let params = {
      collection: COLL_NAME,
      action: actions.UPDATE,
      query: {
        title: TEST_DATA[0].title
      },
      data: { title: 'title-updated-1', $set: { test: 'nonsense' } },
      merge: false
    }
    try {
      await entry.execute(params)
      assert.ok(false, 'no exception thrown')
    } catch (error) {
      assert.ok(
        error
          .toString()
          .indexOf(
            'data must not contain any operator while `merge` with false'
          )
      )
    }

    const [updated] = await coll.find().toArray()
    assert.equal(updated.title, TEST_DATA[0].title) // unchanged
    assert.equal(updated.content, TEST_DATA[0].content) // unchanged
  })

  after(async () => {
    const coll = entry.db.collection(COLL_NAME)
    await coll.deleteMany({})
    if (entry) entry._accessor._conn.close()
  })
})
