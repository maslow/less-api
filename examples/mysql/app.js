const express = require('express')
const { Entry, MysqlAccessor, Ruler } = require('../../dist')
const rules = require('./rules.json')
const { v4: uuidv4 } = require('uuid')
const log4js = require('log4js')

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

function parseToken(token) {
  return {
    role: 'admin',
    userId: 123
  }
}

// create a accessor
// @see https://mongodb.github.io/node-mongodb-native/3.3/reference/ecmascriptnext/connecting/
const accessor = new MysqlAccessor({
  database: 'testdb',
  user: "root",
  password: "kissme",
  host: "localhost",
  port: 3306
})

// create a ruler
const ruler = new Ruler(accessor)

// ruler.setAccessor(accessor)
ruler.load(rules)

// create an entry
const entry = new Entry(accessor, ruler)
const lessLogger = log4js.getLogger('less-api')
lessLogger.level = 'debug'
entry.setLogger(lessLogger)

// entry.init()
// entry.loadRules(rules)

app.post('/entry', async (req, res) => {
  const requestId = uuidv4()
  const { role, userId } = parseToken(req.headers['authorization'])

  // parse params
  const params = entry.parseParams({ ...req.body, requestId })

  const injections = {
    $role: role,
    $userid: userId
  }

  // validate query
  const result = await entry.validate(params, injections)
  if (result.errors) {
    return res.send({
      code: 1,
      error: result.errors,
      requestId
    })
  }

  // execute query
  try {
    const data = await entry.execute(params)
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
