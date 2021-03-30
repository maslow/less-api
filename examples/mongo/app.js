const express = require('express')
const { Entry, MongoAccessor, Ruler } = require('../../dist')
const { v4: uuidv4 } = require('uuid')
const log4js = require('log4js')
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
const dbOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true
}
const accessor = new MongoAccessor('mydb', 'mongodb://localhost:27017', dbOptions)
accessor.init()

// create a ruler
const ruler = new Ruler(accessor)
ruler.load(rules)

// create a entry
const entry = new Entry(accessor, ruler)
const lessLogger = log4js.getLogger('less-api')
lessLogger.level = 'debug'
entry.setLogger(lessLogger)

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
      error: result.errors
    })
  }

  // execute query
  const data = await entry.execute(params)
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