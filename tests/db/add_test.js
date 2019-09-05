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

const COLL_NAME = 'test_add'

/**
 *
 * @param {String} coll
 */
async function restoreTestData (coll) {
  await coll.deleteMany({})
}

describe('Database add', function () {
    this.timeout(10000)

    let entry = new Entry({ db: dbconfig })
    let coll = null
    before(async () => {
        await entry.init()

        // insert data
        coll = entry.db.collection(COLL_NAME)
        await restoreTestData(coll)
    })

    it('add one should be ok', async () => {
        await restoreTestData(coll)
    
        let params = {
          collection: COLL_NAME,
          action: actions.ADD,
          data: { title: 'title-1', content: 'content-1' },
        }
        const r = await entry.execute(params)
        assert.ok(r.insertedId)
        assert.equal(r.insertedCount, 1)

        const inserted = await coll.find().toArray()
        assert.ok(inserted instanceof Array)
        assert.equal(inserted.length, 1)
        assert.equal(inserted[0].title, 'title-1')
        assert.equal(inserted[0].content, 'content-1')
    })

    it('add two docs with multi === true should be ok', async () => {
        await restoreTestData(coll)
        
        const TEST_DATA = [
            { title: 'title-1', content: 'content-1' },
            { title: 'title-2', content: 'content-2' }
        ]
        let params = {
          collection: COLL_NAME,
          action: actions.ADD,
          data: TEST_DATA,
          multi: true
        }

        const r = await entry.execute(params)
        assert.equal(r.insertedCount, 2)
        assert.ok(r.insertedIds)   // object: { '0': 5d71614ff3922156c0f01f23, '1': 5d71614ff3922156c0f01f24 } 

        const inserted = await coll.find().toArray()

        assert.ok(inserted instanceof Array)
        assert.equal(inserted.length, 2)

        assert.equal(inserted[0].title, 'title-1')
        assert.equal(inserted[0].content, 'content-1')

        assert.equal(inserted[1].title, 'title-2')
        assert.equal(inserted[1].content, 'content-2')
    })

    it('add tow docs with multi === false should catch an error', async () => {
        await restoreTestData(coll)
        
        const TEST_DATA = [
            { title: 'title-1', content: 'content-1' },
            { title: 'title-2', content: 'content-2' }
        ]
        let params = {
          collection: COLL_NAME,
          action: actions.ADD,
          data: TEST_DATA,
          multi: false
        }
        
        try{
            await entry.execute(params)
        }catch(err){
            assert.ok(err.toString().indexOf('doc parameter must be an object') > 0)
        }
    })

    after(async () => {
        const coll = entry.db.collection(COLL_NAME)
        await coll.deleteMany({})
        if (entry) entry._accessor._conn.close()
    })
})