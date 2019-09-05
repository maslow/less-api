const assert = require('assert')
const { Entry } = require('../../src/index')
const { actions } = require('../../src/types')

const dbconfig = {
  dbName: 'testdb',
  url: 'mongodb://localhost:27017',
  connSettings: {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
}

const COLL_NAME = 'test_remove'
const TEST_DATA = [
  { title: 'title-1', content: 'content-1' },
  { title: 'title-2', content: 'content-2' },
  { title: 'title-3', content: 'content-3' }
]

async function restoreTestData (coll) {
  await coll.deleteMany({})
  const r = await coll.insertMany(TEST_DATA)
  assert.equal(r.insertedCount, TEST_DATA.length)
}

describe('Database remove', function () {
  this.timeout(10000)

  let entry = new Entry({ db: dbconfig })
  let coll = null
  before(async () => {
    await entry.init()

    // insert data
    coll = entry.db.collection(COLL_NAME)
    await restoreTestData(coll)
  })

  it('remove all should be ok', async () => {
    await restoreTestData(coll)

    const params = {
      collection: COLL_NAME,
      action: actions.REMOVE,
      multi: true
    }
    const r = await entry.execute(params)
    assert.equal(r.deletedCount, 3)

    const data = await coll.find().toArray()
    assert.equal(data.length, 0)
  })

  it('remove one should be ok', async () => {
    await restoreTestData(coll)

    const params = {
      collection: COLL_NAME,
      action: actions.REMOVE,
      query: { title: 'title-1' }
    }
    const r = await entry.execute(params)
    assert.equal(r.deletedCount, 1)

    const data = await coll.find().toArray()
    assert.equal(data.length, 2)
    assert.equal(data[0].title, 'title-2')
    assert.equal(data[0].content, 'content-2')
  })

  it('remove two should be ok', async () => {
    await restoreTestData(coll)

    const params = {
      collection: COLL_NAME,
      action: actions.REMOVE,
      query: {
        $or: [{ title: 'title-1' }, { title: 'title-2' }]
      },
      multi: true
    }
    const r = await entry.execute(params)
    assert.equal(r.deletedCount, 2)

    const data = await coll.find().toArray()

    assert.equal(data.length, 1)
    assert.equal(data[0].title, 'title-3')
    assert.equal(data[0].content, 'content-3')
  })

  after(async () => {
    const coll = entry.db.collection(COLL_NAME)
    await coll.deleteMany({})
    if (entry) entry._accessor._conn.close()
  })
})
