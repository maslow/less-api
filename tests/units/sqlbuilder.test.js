const assert = require('assert')
const { SqlQueryBuilder } = require('../../dist')


/**
 * 不同的查询情况(case N)，参考 docs/convert-sql.md 文档。
 */
describe('class SqlQueryBuilder', () => {
  it('Query CASE 1: query = {} shoud be ok', () => {
    const query = {}
    const builder = new SqlQueryBuilder(query)
    assert(builder instanceof SqlQueryBuilder)
    assert.strictEqual(builder.build(), 'where 1=1')
  })

  it('Query CASE 2: query = { id: 0} shoud be ok', () => {
    const query = { id: 0 }
    const builder = new SqlQueryBuilder(query)
    assert(builder instanceof SqlQueryBuilder)

    const sql = builder.build()
    const values = builder.values()

    assert.strictEqual(sql, 'where 1=1 and id = ?')
    assert.strictEqual(values.length, 1)
    assert.strictEqual(values[0], 0)
  })

  it('Query CASE 3: query = { id: 0, name: "abc"} shoud be ok', () => {
    const query = { id: 0, name: "abc" }
    const builder = new SqlQueryBuilder(query)
    assert(builder instanceof SqlQueryBuilder)

    const sql = builder.build()
    const values = builder.values()
    assert.strictEqual(sql, 'where 1=1 and id = ? and name = ?')
    assert.strictEqual(values.length, 2)
    assert.strictEqual(values[0], 0)
    assert.strictEqual(values[1], `"abc"`)
  })

  it('Query CASE 4 validate() should return error', () => {
    const query = {
      id: 0,
      f1: {
        f2: 0
      }
    }
    const builder = new SqlQueryBuilder(query)
    assert(builder instanceof SqlQueryBuilder)

    const ret = builder.validate()
    assert.strictEqual(ret.ok, false)
    assert.strictEqual(ret.error, 'Invalid Query: nested property found in query')
  })

  it('Query CASE 5 shoud be ok', () => {
    const query = {
      f1: 0,
      f2: {
        $ne: 0
      },
      f3: {
        $in: [1, 2, true, "abc"]
      }
    }

    const builder = new SqlQueryBuilder(query)
    assert(builder instanceof SqlQueryBuilder)

    const sql = builder.build()
    const values = builder.values()
    assert.strictEqual(sql, 'where 1=1 and f1 = ? and f2 <> ? and f3 in (?,?,?,?)')
    assert.strictEqual(values.length, 6)
    assert.strictEqual(values[0], 0)
    assert.strictEqual(values[1], 0)
    assert.strictEqual(values[2], 1)
    assert.strictEqual(values[3], 2)
    assert.strictEqual(values[4], true)
    assert.strictEqual(values[5], `"abc"`)
  })


  it('Query CASE 6 shoud be ok', () => {
    const query = {
      f1: 0,
      $and: [
        {
          f2: { $gt: 0 }
        },
        {
          f2: { $lt: 1 }
        }
      ]
    }

    const builder = new SqlQueryBuilder(query)
    assert(builder instanceof SqlQueryBuilder)

    const sql = builder.build()
    const values = builder.values()

    assert.strictEqual(sql, 'where 1=1 and f1 = ? and (f2 > ? and f2 < ?)')
    assert.strictEqual(values.length, 3)
    assert.strictEqual(values[0], 0)
    assert.strictEqual(values[1], 0)
    assert.strictEqual(values[2], 1)
  })

  it('Query CASE 7 shoud be ok', () => {
    const query = {
      f1: 0,
      $or: [
        {
          f2: { $gt: 0 }
        },
        {
          f2: { $lt: 1 }
        }
      ]
    }

    const builder = new SqlQueryBuilder(query)
    assert(builder instanceof SqlQueryBuilder)

    const sql = builder.build()
    const values = builder.values()

    assert.strictEqual(sql, 'where 1=1 and f1 = ? and (f2 > ? or f2 < ?)')
    assert.strictEqual(values.length, 3)
    assert.strictEqual(values[0], 0)
    assert.strictEqual(values[1], 0)
    assert.strictEqual(values[2], 1)
  })

  it('Query CASE 8 shoud be ok', () => {
    const query = {
      f1: 0,
      '$or': [
        { f2: 1 },
        { f6: { '$lt': 4000 } },
        {
          '$and': [{ f6: { '$gt': 6000 } }, { f6: { '$lt': 8000 } }]
        }
      ]
    }

    const builder = new SqlQueryBuilder(query)
    assert(builder instanceof SqlQueryBuilder)

    const sql = builder.build()
    const values = builder.values()

    assert.strictEqual(sql, 'where 1=1 and f1 = ? and (f2 = ? or f6 < ? or (f6 > ? and f6 < ?))')
    assert.strictEqual(values.length, 5)
    assert.strictEqual(values[0], 0)
    assert.strictEqual(values[1], 1)
    assert.strictEqual(values[2], 4000)
    assert.strictEqual(values[3], 6000)
    assert.strictEqual(values[4], 8000)
  })
})