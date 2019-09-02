const assert = require('assert')
const { Entry, Ruler, Accessor } = require('../../src/index')

describe('class Entry', async () => {
  it('constructor() ok', () => {
    const entry = new Entry()
    assert.ok(entry._ruler instanceof Ruler)
    assert.ok(entry._accessor instanceof Accessor)
  })
})
