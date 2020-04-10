const express = require('express')
const { Entry, MongoAccessor } = require('../dist')
const rules = require('./rules.json')

const app = new express()
app.use(express.json())

function parseToken(token){
  return {
    role: 'admin',
    userId: 123
  }
}

// init the less-api Entry & Db Accessor
const dbOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    poolSize: 10
}
// @see https://mongodb.github.io/node-mongodb-native/3.3/reference/ecmascriptnext/connecting/
const accessor = new MongoAccessor('mydb', 'mongodb://localhost:27017', dbOptions)

const entry = new Entry(accessor)
entry.init()
entry.loadRules(rules)

app.post('/entry', async (req, res) => {
  const { role, userId } = parseToken(req.headers['authorization'])

  // parse params
  const params = entry.parseParams(req.body)

  const injections = {
    $role: role,
    $userid: userId
  } 

  // validate query
  const result = await entry.validate(params, injections)
  if (result.errors) {
    return res.send({
      code: 1,
      data: errors
    })
  }

  // execute query
  const data = await entry.execute(params)
  return res.send({
    code: 0,
    data
  })
})

app.listen(8080, () => console.log('listening on 8080'))
