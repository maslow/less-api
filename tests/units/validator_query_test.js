const assert = require('assert')
const {  Ruler } = require('../../src/index')



describe('Query Validator - required', () => {
    const rules = {
        categories: {
            ".read": {
                condition: true,
                query: { 
                    title: { required: true },
                    content: {},
                    author: { required: false }
                }
            }
        }
    }

    const ruler = new Ruler()
    ruler.load(rules)

    let params = {
        collection: 'categories', action: 'database.queryDocument'
    }


    it('query == undefined should be rejected', async () => {
        const [err, r] = await ruler.validate(params)
        assert.ok(!r)
        assert.ok(err.length, 1)
        assert.equal(err[0].type, 'query')
        assert.equal(err[0].error, 'query is undefined')
    })

    it('query is not object should be rejected', async () => {
        params.query = "invalid type"
        const [err, r] = await ruler.validate(params)
        assert.ok(!r)
        assert.ok(err.length, 1)
        assert.equal(err[0].type, 'query')
        assert.equal(err[0].error, 'query must be an object')
    })

    it('required == true should be ok', async () => {
        params.query = {
            title: 'Title'
        }
        const [err, r] = await ruler.validate(params)
        assert.ok(r)
        assert.ok(!err)
    })

    it('empty query should be rejected', async () => {
        params.query = {
        }
        const [err, r] = await ruler.validate(params)
        assert.ok(!r)
        assert.ok(err.length, 1)
        assert.equal(err[0].type, 'query')
        assert.equal(err[0].error, 'title is required')
    })

    it('required == true should be rejected', async () => {
        params.query = {
            content: 'Content'
        }
        const [err, r] = await ruler.validate(params)
        assert.ok(!r)
        assert.ok(err.length, 1)
        assert.equal(err[0].type, 'query')
        assert.equal(err[0].error, 'title is required')
    })

    it('required == false should be ok', async () => {
        params.query = {
            title: 'Title',
            content: 'Content',
            author: 'Author'
        }
        const [err, r] = await ruler.validate(params)
        assert.ok(r)
        assert.ok(!err)
    })
})

describe('Query Validator - length', () => {
    const rules = {
        categories: {
            ".read": {
                condition: true,
                query: { 
                    title: { length: [3, 6], required: true},
                    content: { length: [3, 6]}
                }
            }
        }
    }

    const ruler = new Ruler()
    ruler.load(rules)

    let params = {
        collection: 'categories', action: 'database.queryDocument'
    }


    it('length == min should be ok', async () => {
        params.query = {
            title: 'abc'
        }
        const [err, r] = await ruler.validate(params)
        assert.ok(r)
        assert.ok(!err)
    })

    it('length == max should be ok', async () => {
        params.query = {
            title: '123456'
        }
        const [err, r] = await ruler.validate(params)
        assert.ok(r)
        assert.ok(!err)
    })

    it('length < min should be rejected', async () => {
        params.query = {
            title: 'ab'
        }
        const [err, r] = await ruler.validate(params)
        assert.ok(!r)
        assert.ok(err.length, 1)
        assert.equal(err[0].type, 'query')
        assert.equal(err[0].error, 'length of title should >= 3 and <= 6')
    })
    

    it('length > max should be rejected', async () => {
        params.query = {
            title: '1234567'
        }
        const [err, r] = await ruler.validate(params)
        assert.ok(!r)
        assert.ok(err.length, 1)
        assert.equal(err[0].type, 'query')
        assert.equal(err[0].error, 'length of title should >= 3 and <= 6')
    })

    it('length < min && require == false should be rejected', async () => {
        params.query = {
            title: 'good',
            content: 'a'
        }
        const [err, r] = await ruler.validate(params)
        assert.ok(!r)
        assert.ok(err.length, 1)
        assert.equal(err[0].type, 'query')
        assert.equal(err[0].error, 'length of content should >= 3 and <= 6')
    })
})

describe('Query Validator - default', () => {
    const rules = {
        categories: {
            ".read": {
                condition: true,
                query: { 
                    title: { default: 'Default Title', required: true},
                    content: { default: 0 }
                }
            }
        }
    }

    const ruler = new Ruler()
    ruler.load(rules)

    let params = {
        collection: 'categories', action: 'database.queryDocument'
    }


    it('default should be applied both required equals to true and false', async () => {
        params.query = {
        }
        const [err, r] = await ruler.validate(params)
        assert.ok(r)
        assert.ok(!err)

        assert.equal(params.query.title, 'Default Title')
        assert.equal(params.query.content, 0)
    })

    it('given value should replace default value', async () => {
        params.query = {
            title: 'Custom Title'
        }
        const [err, r] = await ruler.validate(params)
        assert.ok(r)
        assert.ok(!err)

        assert.equal(params.query.title, 'Custom Title')
        assert.equal(params.query.content, 0)
    })

    it('given value should replace default value both required == true and false', async () => {
        params.query = {
            title: 'Custom Title',
            content: 'Custom Content'
        }
        const [err, r] = await ruler.validate(params)
        assert.ok(r)
        assert.ok(!err)

        assert.equal(params.query.title, 'Custom Title')
        assert.equal(params.query.content, 'Custom Content')
    })
})

describe('Query Validator - in', () => {
    const rules = {
        categories: {
            ".read": {
                condition: true,
                query: { 
                    title: { in: [true, false]},
                    content: { in: ['China', 'Russia'] }
                }
            }
        }
    }

    const ruler = new Ruler()
    ruler.load(rules)

    let params = {
        collection: 'categories', action: 'database.queryDocument'
    }


    it('empty data should be ok', async () => {
        params.query = {
        }
        const [err, r] = await ruler.validate(params)
        assert.ok(r)
        assert.ok(!err)
    })

    it('valid data should be ok ', async () => {
        params.query = {
            title: false,
            content: 'China'
        }
        const [err, r] = await ruler.validate(params)
        assert.ok(r)
        assert.ok(!err)
    })

    it('invalid data should return an error ', async () => {
        params.query = {
            content: 'invalid value'
        }
        const [err, r] = await ruler.validate(params)
        assert.ok(!r)
        assert.ok(err.length, 1)
        assert.equal(err[0].type, 'query')
        assert.equal(err[0].error, 'invalid content')
    })

    it('invalid data for boolean value should return an error ', async () => {
        params.query = {
            title: 1,
            content: 'China'
        }
        const [err, r] = await ruler.validate(params)
        assert.ok(!r)
        assert.ok(err.length, 1)
        assert.equal(err[0].type, 'query')
        assert.equal(err[0].error, 'invalid title')
    })
})


describe('Query Validator - number', () => {
    const rules = {
        categories: {
            ".read": {
                condition: true,
                query: { 
                    total: { number: [0, 100] },
                }
            }
        }
    }

    const ruler = new Ruler()
    ruler.load(rules)

    let params = {
        collection: 'categories', action: 'database.queryDocument'
    }


    it('number == min should be ok', async () => {
        params.query = {
            total: 0
        }
        const [err, r] = await ruler.validate(params)
        assert.ok(r)
        assert.ok(!err)
    })

    it('number == max should be ok', async () => {
        params.query = {
            total: 100
        }
        const [err, r] = await ruler.validate(params)
        assert.ok(r)
        assert.ok(!err)
    })

    it('number < min should be rejected', async () => {
        params.query = {
            total: -1
        }

        const [err, r] = await ruler.validate(params)
        assert.ok(!r)
        assert.ok(err.length, 1)
        assert.equal(err[0].type, 'query')
        assert.equal(err[0].error, 'total should >= 0 and <= 100')
    })
    

    it('number > max should be rejected', async () => {
        params.query = {
            total: 101
        }
        const [err, r] = await ruler.validate(params)
        assert.ok(!r)
        assert.ok(err.length, 1)
        assert.equal(err[0].type, 'query')
        assert.equal(err[0].error, 'total should >= 0 and <= 100')
    })
})


describe('Query Validator - match', () => {
    const rules = {
        categories: {
            ".read": {
                condition: true,
                data: { 
                    account: { match: "^\\d{6,10}$" },
                }
            }
        }
    }

    const ruler = new Ruler()
    ruler.load(rules)

    let params = {
        collection: 'categories', action: 'database.queryDocument'
    }


    it('match should be ok', async () => {
        params.data = {
            account: '1234567'
        }
        const [err, r] = await ruler.validate(params)
        assert.ok(r)
        assert.ok(!err)
    })

    it('match invalid value should return an error', async () => {
        params.data = {
            account: 'abc'
        }
        const [err, r] = await ruler.validate(params)

        assert.ok(!r)
        assert.equal(err.length, 1)
        assert.equal(err[0].type, 'data')
        assert.equal(err[0].error, 'account had invalid format')
    })
})
