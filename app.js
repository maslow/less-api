const express = require('express')
const { Entry } = require('./src')
const rules = require('./examples/rules.json')

const app = new express()

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

  const matched = await entry.validate({ ...params, injections })
  if (!matched) {
    return res.status(403).send('permission denied')
  }

  const result = await entry.execute(params)

  return res.send(result)
})

app.listen(8080, () => console.log('listening on 8080'))
