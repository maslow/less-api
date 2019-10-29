const express = require('express')
const { Entry } = require('../src')

const rules = require('./rules.json')

const app = new express()
app.use(express.json())

function parseToken(token){
  return {
    role: 'admin',
    userId: 123
  }
}

// @see https://mongodb.github.io/node-mongodb-native/3.3/reference/ecmascriptnext/connecting/
const db = {
  dbName: 'mydb',
  url: 'mongodb://localhost:27017',
  connSettings: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    poolSize: 10
  }
}
const entry = new Entry({ db })
entry.init()
entry.loadRules(rules)

app.post('/entry', async (req, res) => {
  const { role, userId } = parseToken(req.headers['Authorization'])

  const { action } = req.body

  const params = entry.parseParams(action, req.body)

  const injections = {
    $role: role,
    $userid: userId
  } 

  const [error, matched] = await entry.validate({ ...params, injections })
  if (error) {
    return res.send({
      code: 1,
      data: error
    })
  }

  const data = await entry.execute(params)
  return res.send({
    code: 0,
    data
  })
})

app.listen(8080, () => console.log('listening on 8080'))
