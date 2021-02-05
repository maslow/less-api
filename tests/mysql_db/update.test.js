
const assert = require('assert')
const { MysqlAccessor, Entry, ActionType } = require('../../dist')
const config = require('./_db')

describe('Database Mysql update', function () {
  this.timeout(10000)

  const accessor = new MysqlAccessor({
    database: config.db,
    user: config.user,
    password: config.password,
    host: config.host,
    port: config.port
  })

  const table = 'test_table'

  let entry = new Entry(accessor)

  before(async () => {
    await entry.init()
    await accessor.conn.execute(`create table IF NOT EXISTS ${table} (id int(11) NOT NULL AUTO_INCREMENT, name varchar(255) NOT NULL, age int, primary key(id))`)
    await accessor.conn.execute(`insert into ${table} (id,name, age) values(111, 'less-api-1', 2)`)
    await accessor.conn.execute(`insert into ${table} (id,name, age) values(112, 'less-api-2', 18)`)
    await accessor.conn.execute(`insert into ${table} (id,name, age) values(113, 'less-api-3', 28)`)
  })

  it('update one passed', async () => {
    const params = {
      collection: table,
      action: ActionType.UPDATE,
      query: { id: 111 },
      data: { name: 'updated-1', age: 1 }
    }
    const r = await entry.execute(params)

    assert.strictEqual(r.updated, 1)
    assert.strictEqual(r.matched, 1)
  })

  it('update all passed', async () => {
    const params = {
      collection: table,
      action: ActionType.UPDATE,
      query: {},
      data: { name: 'updated-all' },
      multi: true
    }
    const r = await entry.execute(params)

    assert.strictEqual(r.updated, 3)
    assert.strictEqual(r.matched, 3)
  })
  

  it('update with multi = false should only update 1 row', async () => {
    const params = {
      collection: table,
      action: ActionType.UPDATE,
      query: {},
      data: { name: 'updated-all-1' },
      multi: false // default is false
    }
    const r = await entry.execute(params)

    assert.strictEqual(r.updated, 1)
    assert.strictEqual(r.matched, 1)
  })

  it('update age > 2', async () => {
    const params = {
      collection: table,
      action: ActionType.UPDATE,
      query: { age: { $gt: 2 } },
      data: { name: 'updated-parts', age: 0 },
      multi: true
    }
    const r = await entry.execute(params)

    assert.strictEqual(r.updated, 2)
    assert.strictEqual(r.matched, 2)
  })

  after(async () => {
    await accessor.conn.execute(`drop table ${table}`)
    accessor.close()
  })
})