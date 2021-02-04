
const assert = require('assert')
const { SqlBuilder } = require('../../dist/accessor/sql_builder')
const { ActionType } = require('../../dist/types')
const { strictCompareArray } = require('../utils')

describe('class SqlBuilder', () => {
  it('constructor() passed', () => {
    const params = {
      collection: 'test_table',
      action: ActionType.READ,
      query: {},
    }

    const builder = new SqlBuilder(params)
    assert(builder instanceof SqlBuilder)

    assert.strictEqual(builder.query, params.query)
    assert.strictEqual(builder.table, params.collection)
  })

  it('select() with query: passed', () => {
    const params = {
      collection: 'test_table',
      action: ActionType.READ,
      query: { id: 0, name: 'abc' },
    }

    const builder = new SqlBuilder(params)
    assert(builder instanceof SqlBuilder)

    const { sql, values } = builder.select()
    assert.strictEqual(sql, 'select * from test_table where 1=1 and id = ? and name = ? limit ?,? ')
    strictCompareArray(values, [0, 'abc', 0, 100])
  })

  it('select() with projection: passed', () => {
    const params = {
      collection: 'test_table',
      action: ActionType.READ,
      query: { id: 0, name: 'abc' },
      projection: { id: true, name: true }
    }

    const builder = new SqlBuilder(params)
    assert(builder instanceof SqlBuilder)

    const { sql, values } = builder.select()

    assert.strictEqual(sql, 'select id,name from test_table where 1=1 and id = ? and name = ? limit ?,? ')
    strictCompareArray(values, [0, 'abc', 0, 100])
  })

  it('select() with order: passed', () => {
    const params = {
      collection: 'test_table',
      action: ActionType.READ,
      query: { id: 0, name: 'abc' },
      order: [
        { field: 'id', direction: 'asc' },
        { field: 'name', direction: 'desc' }
      ],
    }

    const builder = new SqlBuilder(params)
    assert(builder instanceof SqlBuilder)

    const { sql, values } = builder.select()

    assert.strictEqual(sql, 'select * from test_table where 1=1 and id = ? and name = ? limit ?,? order by id asc,name desc')
    strictCompareArray(values, [0, 'abc', 0, 100])
  })

  it('count() with query: passed', () => {
    const params = {
      collection: 'test_table',
      action: ActionType.COUNT,
      query: { id: 0, name: 'abc' },
    }

    const builder = new SqlBuilder(params)
    assert(builder instanceof SqlBuilder)

    const { sql, values } = builder.count()

    assert.strictEqual(sql, 'select count(*) from test_table where 1=1 and id = ? and name = ?')
    strictCompareArray(values, [0, 'abc'])
  })

  it('delete() with query: passed', () => {
    const params = {
      collection: 'test_table',
      action: ActionType.REMOVE,
      query: { id: 0, name: 'abc' },
    }

    const builder = new SqlBuilder(params)
    assert(builder instanceof SqlBuilder)

    const { sql, values } = builder.delete()

    assert.strictEqual(sql, 'delete from test_table where 1=1 and id = ? and name = ? limit ?,? ')
    strictCompareArray(values, [0, 'abc', 0, 1])
  })

  it('delete() with multi = true: passed', () => {
    const params = {
      collection: 'test_table',
      action: ActionType.REMOVE,
      query: { id: 0, name: 'abc' },
      multi: true
    }

    const builder = new SqlBuilder(params)
    assert(builder instanceof SqlBuilder)

    const { sql, values } = builder.delete()

    assert.strictEqual(sql, 'delete from test_table where 1=1 and id = ? and name = ? limit ?,? ')
    strictCompareArray(values, [0, 'abc', 0, 100])
  })

  it('insert() with data: passed', () => {
    const params = {
      collection: 'test_table',
      action: ActionType.ADD,
      data: { id: 0, name: 'abc' },
    }

    const builder = new SqlBuilder(params)
    assert(builder instanceof SqlBuilder)

    const { sql, values } = builder.insert()

    assert.strictEqual(sql, 'insert into test_table (id,name) values (?,?)')
    strictCompareArray(values, [0, 'abc'])
  })

  it('update() with data: passed', () => {
    const params = {
      collection: 'test_table',
      action: ActionType.UPDATE,
      data: { id: 0, name: 'abc' },
    }

    const builder = new SqlBuilder(params)
    assert(builder instanceof SqlBuilder)

    const { sql, values } = builder.update()

    assert.strictEqual(sql, 'update test_table set id=?,name=? where 1=1 limit ?,? ')
    strictCompareArray(values, [0, 'abc', 0, 1])
  })

  it('update() with query: passed', () => {
    const params = {
      collection: 'test_table',
      action: ActionType.UPDATE,
      data: { id: 1, name: 'xyz' },
      query: { id: 0, name: 'abc' }
    }

    const builder = new SqlBuilder(params)
    assert(builder instanceof SqlBuilder)

    const { sql, values } = builder.update()

    assert.strictEqual(sql, 'update test_table set id=?,name=? where 1=1 and id = ? and name = ? limit ?,? ')
    strictCompareArray(values, [1, 'xyz', 0, 'abc', 0, 1])
  })

  it('update() with  multi = true: passed', () => {
    const params = {
      collection: 'test_table',
      action: ActionType.UPDATE,
      data: { id: 1, name: 'xyz' },
      query: { id: 0, name: 'abc' },
      multi: true
    }

    const builder = new SqlBuilder(params)
    assert(builder instanceof SqlBuilder)

    const { sql, values } = builder.update()

    assert.strictEqual(sql, 'update test_table set id=?,name=? where 1=1 and id = ? and name = ? limit ?,? ')
    strictCompareArray(values, [1, 'xyz', 0, 'abc', 0, 100])
  })
})