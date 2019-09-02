const assert = require('assert')
const { Entry, Ruler, Accessor } = require('../src/index')
const buildins = require('../src/validators')

describe('class Entry', async () => {
  it('constructor() ok', () => {
    const entry = new Entry()
    assert.ok(entry._ruler instanceof Ruler)
    assert.ok(entry._accessor instanceof Accessor)
  })

  it('_loadBuiltinValidators() ok', () => {
    // 初始化 validator 是否正确
    const entry = new Entry()
    const validtrs = entry._ruler._validators

    assert.equal(Object.keys(buildins).length, Object.keys(validtrs).length)
    for (let name in buildins) {
      const _names = Object.keys(validtrs)
      assert.ok(_names.includes(name))
      assert.equal(buildins[name], validtrs[name])
    }
  })
})
