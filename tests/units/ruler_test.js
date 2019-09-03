const assert = require('assert')
const { Entry, Ruler, Accessor } = require('../../src/index')
const buildins = require('../../src/validators')

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
        const query = {}
        const data = {}
        const options = {}
        const injections = {
            $admin: true
        }
        const r = await ruler.validate('categories', 'database.queryDocument', query, data, options, injections)
        assert.ok(r, 'condition-boolean error')

        const r1 = await ruler.validate('categories', 'database.updateDocument', query, data, options, injections)
        assert.ok(r1, 'condition-string error')

        const r2 = await ruler.validate('categories', 'database.addDocument', query, data, options, injections)
        assert.ok(r2, 'condition-object error')

        const r3 = await ruler.validate('categories', 'database.deleteDocument', query, data, options, injections)
        assert.ok(r3, 'condition-array error')
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
        const query = {}
        const data = {}
        const options = {}
        const injections = {
            $admin: false
        }
        const r = await ruler.validate('categories', 'database.queryDocument', query, data, options, injections)
        assert.ok(!r, 'condition-boolean error')

        const r1 = await ruler.validate('categories', 'database.updateDocument', query, data, options, injections)
        assert.ok(!r1, 'condition-string error')

        const r2 = await ruler.validate('categories', 'database.addDocument', query, data, options, injections)
        assert.ok(!r2, 'condition-object error')

        const r3 = await ruler.validate('categories', 'database.deleteDocument', query, data, options, injections)
        assert.ok(!r3, 'condition-array error')
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
        const query = {}
        const data = {}
        const options = {}
        let injections = {
            $admin: true
        }
        let r = await ruler.validate('categories', 'database.queryDocument', query, data, options, injections)
        assert.ok(r)

        injections = {
            $product: true
        }
        r = await ruler.validate('categories', 'database.queryDocument', query, data, options, injections)
        assert.ok(r)

        injections = {
            $market: true
        }
        r = await ruler.validate('categories', 'database.queryDocument', query, data, options, injections)
        assert.ok(r)

        injections = {
            $other: true
        }
        r = await ruler.validate('categories', 'database.queryDocument', query, data, options, injections)
        assert.ok(!r)
    })
})