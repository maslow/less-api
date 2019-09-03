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
    it('should passed', async () => {
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
        let r = await ruler.validate(params)
        assert.ok(r, 'condition-boolean error')

        params.action = 'database.updateDocument'
        r = await ruler.validate(params)
        assert.ok(r, 'condition-string error')

        params.action = 'database.addDocument'
        r = await ruler.validate(params)
        assert.ok(r, 'condition-object error')

        params.action = 'database.deleteDocument'
        r = await ruler.validate(params)
        assert.ok(r, 'condition-array error')
    })

    it('should reject', async () => {
        const rules = {
            categories: {
                ".read": false,
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
            $admin: false
        }
        let params = {
            collection: 'categories', action: 'database.queryDocument', injections
        }
        let r = await ruler.validate(params)
        assert.ok(!r, 'condition-boolean error')

        params.action = 'database.updateDocument'
        r = await ruler.validate(params)
        assert.ok(!r, 'condition-string error')

        params.action = 'database.addDocument'
        r = await ruler.validate(params)
        assert.ok(!r, 'condition-object error')

        params.action = 'database.deleteDocument'
        r = await ruler.validate(params)
        assert.ok(!r, 'condition-array error')
    })
})


describe('class Ruler validate()', () => {
    it('multiple rules', async () => {
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

        let injections = {
            $admin: true
        }

        let params = { collection: 'categories', action: 'database.queryDocument', injections}
        let r = await ruler.validate(params)
        assert.ok(r)

        params.injections = {
            $product: true
        }
        r = await ruler.validate(params)
        assert.ok(r)

        params.injections = {
            $market: true
        }

        r = await ruler.validate(params)
        assert.ok(r)

        params.injections = {
            $other: true
        }
        r = await ruler.validate(params)
        assert.ok(!r)
    })
})