const express = require('express')
const oneapi = require('./src/index')
const rules = require('./examples/rules.json')

const app = new express()

// @see https://mongodb.github.io/node-mongodb-native/3.3/reference/ecmascriptnext/connecting/
const db = {
  dbName: 'mydb', 
  url: 'mongodb://localhost:27017/', 
  connSettings: { }
}
const entry = new oneapi.Entry({ db })
entry.loadRules(rules)

// one api entry
app.post('/entry', async (req, res) => {
  const { role, userId, appid } = parseToken(req.headers['Authorization'])
  const { collection, action, query, data, options } = req.body

  const injections = {
    $role: role,
    $userid: userId,
    $appid: appid,
    $query: query,
    $data: data
  }

  const matched = await entry.validate(collection, action, query, data, options, injections)
  if(!matched){
      return res.status(403).send('permission denied')
  }

  const params = { collection, action, query, data, options }
  const result = await entry.execute(params)

  return res.send(result)
})

// other apis
app.post('/payment', (req, res) => {
  // ...
})

app.post('/upload', (req, res) => {
  // ...
})

app.listen(8080, () => console.log('listening on 8080'))
