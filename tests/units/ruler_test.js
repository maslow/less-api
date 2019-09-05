const assert = require('assert')
const {  Ruler } = require('../../src/index')
const buildins = require('../../src/validators')
const Processor = require('../../src/processor')

describe('class Ruler', () => {

    it('_loadBuiltinValidators() ok', () => {
        // 初始化 validator 是否正确
        const ruler = new Ruler()
        const validtrs = ruler._validators

        assert.equal(Object.keys(buildins).length, Object.keys(validtrs).length)
        for (let name in buildins) {
            const _names = Object.keys(validtrs)
            assert.ok(_names.includes(name))
            assert.equal(buildins[name], validtrs[name])
        }
    })

    it('registerValidator() ok', () => {
        const ruler = new Ruler()
        ruler.registerValidator('test', (config, context) => {
            return true
        })
        assert.ok(ruler._validators['test'])
        assert.ok(ruler._validators['test'] instanceof Function)
        assert.ok(ruler._validators['test']())
    })

    it('load() ok', () => {
        const rules = {
            categories: {
                ".read": true,
                ".update": "false",
            }
        }
        const ruler = new Ruler()
        ruler.load(rules)

        const r = ruler._rules.categories
        assert.ok(r)
        assert.ok(r['.read'])
        assert.ok(r['.update'])
        assert.ok(!r['.add'])
        assert.ok(r['.read'] instanceof Array)

        const v = r['.read'][0]
        assert.ok(v)
        assert.ok(v.condition instanceof Processor)
        assert.equal(v.condition._name, 'condition')
        assert.equal(v.condition._type, 'validator')
        assert.equal(v.condition._config, 'true')
        assert.ok(v.condition._handler instanceof Function)
    })

    it('load() should throw unknown validator error', () => {
        const rules = {
            categories: {
                ".read": {
                    'unknown-validator': 'for-test'
                },
            }
        }
        const ruler = new Ruler()
        assert.throws(() => ruler.load(rules))
    })
})

describe('class Ruler validate() - condition', () => {
    const rules = {
        categories: {
            ".read": true,
            ".update": "$admin === true",
            ".add": {
                condition: "$admin === true"
            },
            ".remove": "$admin === true"
        }
    }

    const ruler = new Ruler()
    ruler.load(rules)
    const injections = {
        $admin: true
    }

    let params = {
        collection: 'categories', action: 'database.queryDocument', injections
    }

    it('read should be ok', async () => {
        params.action = 'database.queryDocument'
        const r = await ruler.validate(params)
        assert.ok(r)
    })

    it('update should be ok', async () => {
        params.action = 'database.updateDocument'
        const r = await ruler.validate(params)
        assert.ok(r)
    })

    it('add should be ok', async () => {
        params.action = 'database.addDocument'
        const r = await ruler.validate(params)
        assert.ok(r)
    })

    it('remove should be ok', async () => {
        params.action = 'database.deleteDocument'
        const r = await ruler.validate(params)
        assert.ok(r)
    })

    it('read should be rejected', async () => {
        rules.categories['.read'] = false
        ruler.load(rules)
        const injections = { $admin: false }
        let params = { collection: 'categories', action: 'database.queryDocument', injections }
        let r = await ruler.validate(params)
        assert.ok(!r)
    })

    it('update should be rejected', async () => {
        const injections = { $admin: false }
        let params = { collection: 'categories', action: 'database.updateDocument', injections }

        r = await ruler.validate(params)
        assert.ok(!r)
    })

    it('add should be rejected', async () => {
        const injections = { $admin: false }
        let params = { collection: 'categories', action: 'database.addDocument', injections }
    
        r = await ruler.validate(params)
        assert.ok(!r)
    })

    it('remove should be rejected', async () => {
        const injections = { $admin: false }
        let params = { collection: 'categories', action: 'database.deleteDocument', injections }
    
        r = await ruler.validate(params)
        assert.ok(!r)
    })
})


describe('class Ruler validate() - multiple rules', () => {
    const rules = {
        categories: {
            ".read": [
                { condition: "$admin === true" },
                { condition: "$product === true"},
                { condition: "$market === true"}
            ]
        }
    }
    const ruler = new Ruler()
    ruler.load(rules)

    it('injections with { $admin: true } should be ok', async () => {
        const injections = { $admin: true }
        const params = { collection: 'categories', action: 'database.queryDocument', injections}
        const r = await ruler.validate(params)
        assert.ok(r)
    })

    it('injections with { $product: true } should be ok', async () => {
        const injections = { $product: true }
        const params = { collection: 'categories', action: 'database.queryDocument', injections}
        const r = await ruler.validate(params)
        assert.ok(r)
    })

    it('injections with { $market: true } should be ok', async () => {
        const injections = { $market: true }
        const params = { collection: 'categories', action: 'database.queryDocument', injections}
        const r = await ruler.validate(params)
        assert.ok(r)
    })

    it('injections with { $other: true } should be rejected', async () => {
        const injections = { $other: true }
        const params = { collection: 'categories', action: 'database.queryDocument', injections}
        const r = await ruler.validate(params)
        assert.ok(!r)
    })
})