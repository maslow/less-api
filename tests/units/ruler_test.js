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
        const [err, r] = await ruler.validate(params)
        assert.ok(r)
        assert.ok(!err)
    })

    it('update should be ok', async () => {
        params.action = 'database.updateDocument'
        const [err, r] = await ruler.validate(params)
        assert.ok(r)
        assert.ok(!err)
    })

    it('add should be ok', async () => {
        params.action = 'database.addDocument'
        const [err, r] = await ruler.validate(params)
        assert.ok(r)
        assert.ok(!err)
    })

    it('remove should be ok', async () => {
        params.action = 'database.deleteDocument'
        const [err, r] = await ruler.validate(params)
        assert.ok(r)
        assert.ok(!err)
    })

    it('read should be rejected', async () => {
        rules.categories['.read'] = false
        ruler.load(rules)
        const injections = { $admin: false }
        let params = { collection: 'categories', action: 'database.queryDocument', injections }
        const [err, r] = await ruler.validate(params)
        assert.ok(!r)
        assert.ok(err)
        assert.equal(err.length, 1)
        assert.equal(err[0].type, 'condition')
    })

    it('update should be rejected', async () => {
        const injections = { $admin: false }
        let params = { collection: 'categories', action: 'database.updateDocument', injections }

        const [err, r] = await ruler.validate(params)
        assert.ok(!r)
        assert.ok(err)
        assert.equal(err.length, 1)
        assert.equal(err[0].type, 'condition')
    })

    it('add should be rejected', async () => {
        const injections = { $admin: false }
        let params = { collection: 'categories', action: 'database.addDocument', injections }
    
        const [err, r] = await ruler.validate(params)
        assert.ok(!r)
        assert.ok(err)
        assert.equal(err.length, 1)
        assert.equal(err[0].type, 'condition')
    })

    it('remove should be rejected', async () => {
        const injections = { $admin: false }
        let params = { collection: 'categories', action: 'database.deleteDocument', injections }
    
        const [err, r] = await ruler.validate(params)
        assert.ok(!r)
        assert.ok(err)
        assert.equal(err.length, 1)
        assert.equal(err[0].type, 'condition')
    })

    it('invalid categories given should be rejected', async () => {
        const injections = { $admin: true }
        let params = { collection: 'invalid_categories', action: 'database.deleteDocument', injections }
        const [err, r] = await ruler.validate(params)
        assert.ok(!r)
        assert.ok(err)
        assert.equal(err.length, 1)
        assert.equal(err[0].type, 0)
    })

    it('invalid action given should be rejected', async () => {
        const injections = { $admin: true }
        let params = { collection: 'categories', action: 'invalid.database.deleteDocument', injections }
        const [err, r] = await ruler.validate(params)
        assert.ok(!r)
        assert.ok(err)
        assert.equal(err.length, 1)
        assert.equal(err[0].type, 0)
    })
})


describe('class Ruler validate() - multiple rules', () => {
    const rules = {
        categories: {
            ".read": [
                { condition: "$role === 'admin'" },
                { condition: "$role === 'product'"},
                { condition: "$role === 'market'"}
            ]
        }
    }
    const ruler = new Ruler()
    ruler.load(rules)

    it('injections with { $role: "admin" } should be ok', async () => {
        const injections = { $role: 'admin' }
        const params = { collection: 'categories', action: 'database.queryDocument', injections}
        const [err, r] = await ruler.validate(params)
        assert.ok(r)
        assert.ok(!err)
    })

    it('injections with { $role: "product" } should be ok', async () => {
        const injections = { $role: 'product' }
        const params = { collection: 'categories', action: 'database.queryDocument', injections}
        const [err, r] = await ruler.validate(params)
        assert.ok(r)
        assert.ok(!err)
    })

    it('injections with { $role: "market" } should be ok', async () => {
        const injections = { $role: 'market' }
        const params = { collection: 'categories', action: 'database.queryDocument', injections}
        const [err, r] = await ruler.validate(params)
        assert.ok(r)
        assert.ok(!err)
    })

    it("injections with { $role: 'other' } should be rejected", async () => {
        const injections = { $role: 'other' }
        const params = { collection: 'categories', action: 'database.queryDocument', injections}
        const [err, r] = await ruler.validate(params)
        assert.ok(!r)
        assert.equal(err[0].type, 'condition')
    })
})