const express = require('express')
const { Proxy, MongoAccessor, Policy } = require('less-api')
const { v4: uuidv4 } = require('uuid')

const rules = {
  categories: {
    'read': true,
    'update': true,
    'add': true,
    'remove': true
  }
}

const app = new express()
app.use(express.json())

// request pre-process, include uid parse and cross-domain set
app.all('*', function (_req, res, next) {
  // set cross domain
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  res.header('Access-Control-Allow-Methods', '*')
  res.header('Content-Type', 'application/json;charset=utf-8')
  next()
})

// create a accessor

const accessor = new MongoAccessor('mydb', 'mongodb://localhost:27017', { directConnection: true})
accessor.init()

// create a policy
const policy = new Policy(accessor)
policy.load(rules)

// create a proxy
const proxy = new Proxy(accessor, policy)

app.post('/entry', async (req, res) => {
  const requestId = uuidv4()
  const { role, userId } = parseToken(req.headers['authorization'])
  
  // parse params
  const params = proxy.parseParams({ ...req.body, requestId })

  const injections = {
    $role: role,
    $userid: userId
  }

  // validate query
  const result = await proxy.validate(params, injections)
  if (result.errors) {
    return res.send({
      code: 1,
      error: result.errors
    })
  }

  // execute query
  const data = await proxy.execute(params)
  return res.send({
    code: 0,
    data
  })
})

app.listen(8081, () => console.log('listening on 8081'))


/* eslint-disable no-unused-vars */
function parseToken(_token) {
  return {
    role: 'admin',
    userId: 123
  }
}