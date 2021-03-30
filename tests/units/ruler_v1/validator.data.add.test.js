const assert = require('assert')
const {  Ruler } = require('../../../dist/ruler/ruler_v1')

describe('Date Validator - merge options', () => {
    const rules = {
        categories: {
            ".add": {
                condition: true,
                data: { 
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
        collection: 'categories', action: 'database.addDocument'
    }

    it('replace one while operator exists and merge == false should throw error', async () => {
        params.data = {
            title: 'test-title',
            $set: {
                content: 'content'
            }
        }
        const { matched, errors } = await ruler.validate(params, {})
        assert.ok(!matched)
        assert.ok(errors.length, 1)
        assert.equal(errors[0].type, 'data')
        assert.equal(errors[0].error, 'data must not contain any operator while `merge` with false')
    })

    it('update one while operator NOT exists and merge == true should throw error', async () => {
        params.data = {
            title: 'test-title'
        }
        params.merge = true

        const { matched, errors } = await ruler.validate(params, {})
        assert.ok(!matched)
        assert.ok(errors.length, 1)
        assert.equal(errors[0].type, 'data')
        assert.equal(errors[0].error, 'data must contain operator while `merge` with true')
      })
})

describe('Data Validator - required', () => {
    const rules = {
        categories: {
            ".add": {
                condition: true,
                data: { 
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
        collection: 'categories', action: 'database.addDocument'
    }


    it('data == undefined should be rejected', async () => {
        const { matched, errors } = await ruler.validate(params, {})
        assert.ok(!matched)
        assert.ok(errors.length, 1)
        assert.equal(errors[0].type, 'data')
        assert.equal(errors[0].error, 'data is undefined')
    })

    it('data is not object should be rejected', async () => {
        params.data = "invalid type"
        
        const { matched, errors } = await ruler.validate(params, {})
        assert.ok(!matched)
        assert.ok(errors.length, 1)
        assert.equal(errors[0].type, 'data')
        assert.equal(errors[0].error, 'data must be an object')
    })

    it('required == true should be ok', async () => {
        params.data = {
            title: 'Title'
        }
        const { matched, errors } = await ruler.validate(params, {})
        assert.ok(matched)
        assert.ok(!errors)
    })

    it('empty data should be rejected', async () => {
        params.data = {
        }
        const { matched, errors } = await ruler.validate(params, {})
        assert.ok(!matched)
        assert.equal(errors.length, 1)
        assert.equal(errors[0].type, 'data')
        assert.equal(errors[0].error, 'data is empty')
    })

    it('required == true should be rejected', async () => {
        params.data = {
            content: 'Content'
        }
        const { matched, errors } = await ruler.validate(params, {})
        assert.ok(!matched)
        assert.equal(errors.length, 1)
        assert.equal(errors[0].type, 'data')
        assert.equal(errors[0].error, 'title is required')
    })

    it('required == false should be ok', async () => {
        params.data = {
            title: 'Title',
            content: 'Content',
            author: 'Author'
        }

        const { matched, errors } = await ruler.validate(params, {})
        assert.ok(matched)
        assert.ok(!errors)
    })
})

describe('Data Validator - length', () => {
    const rules = {
        categories: {
            ".add": {
                condition: true,
                data: { 
                    title: { length: [3, 6], required: true},
                    content: { length: [3, 6]}
                }
            }
        }
    }

    const ruler = new Ruler()
    ruler.load(rules)

    let params = {
        collection: 'categories', action: 'database.addDocument'
    }


    it('length == min should be ok', async () => {
        params.data = {
            title: 'abc'
        }

        const { matched, errors } = await ruler.validate(params, {})
        assert.ok(matched)
        assert.ok(!errors)
    })

    it('length == max should be ok', async () => {
        params.data = {
            title: '123456'
        }
        const { matched, errors } = await ruler.validate(params, {})
        assert.ok(matched)
        assert.ok(!errors)
    })

    it('length < min should be rejected', async () => {
        params.data = {
            title: 'ab'
        }
        const { matched, errors } = await ruler.validate(params, {})
        assert.ok(!matched)
        assert.equal(errors.length, 1)
        assert.equal(errors[0].type, 'data')
        assert.equal(errors[0].error, 'length of title should >= 3 and <= 6')
    })
    

    it('length > max should be rejected', async () => {
        params.data = {
            title: '1234567'
        }
        const { matched, errors } = await ruler.validate(params, {})
        assert.ok(!matched)
        assert.equal(errors.length, 1)
        assert.equal(errors[0].type, 'data')
        assert.equal(errors[0].error, 'length of title should >= 3 and <= 6')
    })

    it('length < min && require == false should be rejected', async () => {
        params.data = {
            title: 'good',
            content: 'a'
        }
        const { matched, errors } = await ruler.validate(params, {})
        assert.ok(!matched)
        assert.equal(errors.length, 1)
        assert.equal(errors[0].type, 'data')
        assert.equal(errors[0].error, 'length of content should >= 3 and <= 6')
    })
})

describe('Data Validator - default', () => {
    const rules = {
        categories: {
            ".add": {
                condition: true,
                data: { 
                    title: { default: 'Default Title', required: true},
                    content: { default: 0 }
                }
            }
        }
    }

    const ruler = new Ruler()
    ruler.load(rules)

    let params = {
        collection: 'categories', action: 'database.addDocument'
    }


    it('default should be applied both required equals to true and false', async () => {
        params.data = {
            content: ''
        }
        const { matched, errors } = await ruler.validate(params, {})
        assert.ok(matched)
        assert.ok(!errors)

        assert.equal(params.data.title, 'Default Title')
        assert.equal(params.data.content, 0)
    })

    it('given value should replace default value', async () => {
        params.data = {
            title: 'Custom Title'
        }
        const { matched, errors } = await ruler.validate(params, {})
        assert.ok(matched)
        assert.ok(!errors)

        assert.equal(params.data.title, 'Custom Title')
        assert.equal(params.data.content, 0)
    })

    it('given value should replace default value both required == true and false', async () => {
        params.data = {
            title: 'Custom Title',
            content: 'Custom Content'
        }
        const { matched, errors } = await ruler.validate(params, {})
        assert.ok(matched)
        assert.ok(!errors)

        assert.equal(params.data.title, 'Custom Title')
        assert.equal(params.data.content, 'Custom Content')
    })
})

describe('Data Validator - in', () => {
    const rules = {
        categories: {
            ".add": {
                condition: true,
                data: { 
                    title: { in: [true, false]},
                    content: { in: ['China', 'Russia'] }
                }
            }
        }
    }

    const ruler = new Ruler()
    ruler.load(rules)

    let params = {
        collection: 'categories', action: 'database.addDocument'
    }


    it('empty data should be rejected', async () => {
        params.data = {
        }
        const { matched, errors } = await ruler.validate(params, {})
        assert.ok(!matched)
        assert.ok(errors)
    })

    it('valid data should be ok ', async () => {
        params.data = {
            title: false,
            content: 'China'
        }
        
        const { matched, errors } = await ruler.validate(params, {})
        assert.ok(matched)
        assert.ok(!errors)
    })

    it('invalid data should return an error ', async () => {
        params.data = {
            content: 'invalid value'
        }
        
        const { matched, errors } = await ruler.validate(params, {})
        assert.ok(!matched)
        assert.equal(errors.length, 1)
        assert.equal(errors[0].type, 'data')
    })

    it('invalid data for boolean value should return an error ', async () => {
        params.data = {
            title: 1,
            content: 'China'
        }
        
        const { matched, errors } = await ruler.validate(params, {})
        assert.ok(!matched)
        assert.equal(errors.length, 1)
        assert.equal(errors[0].type, 'data')
    })
})


describe('Data Validator - number', () => {
    const rules = {
        categories: {
            ".add": {
                condition: true,
                data: { 
                    total: { number: [0, 100] },
                }
            }
        }
    }

    const ruler = new Ruler()
    ruler.load(rules)

    let params = {
        collection: 'categories', action: 'database.addDocument'
    }


    it('number == min should be ok', async () => {
        params.data = {
            total: 0
        }
        const { matched, errors } = await ruler.validate(params, {})
        assert.ok(matched)
        assert.ok(!errors)
    })

    it('number == max should be ok', async () => {
        params.data = {
            total: 100
        }
        
        const { matched, errors } = await ruler.validate(params, {})
        assert.ok(matched)
        assert.ok(!errors)
    })

    it('number < min should be rejected', async () => {
        params.data = {
            total: -1
        }

        const { matched, errors } = await ruler.validate(params, {})
        assert.ok(!matched)
        assert.equal(errors.length, 1)
        assert.equal(errors[0].type, 'data')
        assert.equal(errors[0].error, 'total should >= 0 and <= 100')
    })
    

    it('number > max should be rejected', async () => {
        params.data = {
            total: 101
        }
        
        const { matched, errors } = await ruler.validate(params, {})
        assert.ok(!matched)
        assert.equal(errors.length, 1)
        assert.equal(errors[0].type, 'data')
        assert.equal(errors[0].error, 'total should >= 0 and <= 100')
    })
})


describe('Data Validator - match', () => {
    const rules = {
        categories: {
            ".add": {
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
        collection: 'categories', action: 'database.addDocument'
    }


    it('match should be ok', async () => {
        params.data = {
            account: '1234567'
        }
        
        const { matched, errors } = await ruler.validate(params, {})
        assert.ok(matched)
        assert.ok(!errors)
    })

    it('match invalid value should return an error', async () => {
        params.data = {
            account: 'abc'
        }
        
        const { matched, errors } = await ruler.validate(params, {})
        assert.ok(!matched)
        assert.equal(errors.length, 1)
        assert.equal(errors[0].type, 'data')
        assert.equal(errors[0].error, 'account had invalid format')
    })
})


describe('Data validator - Flatten Data', () => {
    const rules = {
        categories: {
            ".add": {
                condition: true,
                data: { 
                    title: { required: true },
                    content: { required: true },
                    author: { required: true },
                    age: { number: [0, 100]},
                    gender: { in: [0, 1], default: 1 }
                }
            }
        }
    }

    const ruler = new Ruler()
    ruler.load(rules)

    let params = {
        collection: 'categories', action: 'database.addDocument'
    }

    it('flatten data should be ok', async () => {
        params.merge = true
        params.data = {
            title: 'title',
            $set: {
                content: 'content',
                author: 123
            },
            $inc: {
                age: 1
            }
        }
        
        const { matched, errors } = await ruler.validate(params, {})
        console.log({errors})
        assert.ok(matched)
        assert.ok(!errors)
        assert.equal(params.data.gender, 1)
    })
})

describe('Data validator - Condition', () => {
    const rules = {
        categories: {
            ".add": {
                condition: true,
                data: { 
                    author_id: "$userid == $value",
                    createdBy: {
                        condition: "$userid == $value"
                    }
                }
            }
        }
    }

    const ruler = new Ruler()
    ruler.load(rules)

    let params = {
        collection: 'categories', action: 'database.addDocument'
    }

    it('data condition should be ok', async () => {
        params.data = {
            author_id: 123,
            createdBy: 123
        }
        
        const injections = {
            $userid: 123
        }
        
        const { matched, errors } = await ruler.validate(params, injections)
        assert.ok(matched)
        assert.ok(!errors)
    })

    it('data condition should be rejected', async () => {
        params.data = {
            author_id: 1,
            createdBy: 2
        }
        
        const injections = {
            $userid: 123
        }
        
        const { matched, errors } = await ruler.validate(params, injections)
        assert.ok(!matched)
        assert.ok(errors)
        assert.equal(errors[0].type, 'data')
    })
})