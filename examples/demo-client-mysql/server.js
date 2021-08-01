const express = require('express')
const { Proxy, MysqlAccessor, Policy } = require('less-api')
const rules = require('./rules.json')
const { v4: uuidv4 } = require('uuid')

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
const accessor = new MysqlAccessor({
  database: 'testdb',
  user: "root",
  password: "kissme",
  host: "localhost",
  port: 3306
})

// create a policy
const policy = new Policy(accessor)

// ruler.setAccessor(accessor)
policy.load(rules)

// create an proxy
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
      error: result.errors,
      requestId
    })
  }

  // execute query
  try {
    const data = await proxy.execute(params)
    return res.send({
      code: 0,
      data,
      requestId
    })
  } catch (error) {
    return res.send({
      code: 2,
      error: error.toString(),
      requestId
    })
  }
})

app.listen(8080, () => console.log('listening on 8080'))



function parseToken(token) {
  return {
    role: 'admin',
    userId: 123
  }
}