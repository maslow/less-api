const express = require('express')
const { Entry } = require('../src')

const rules = {
    categories: {
        ".read": true,
        ".update": "$admin === true",
        ".add": "$admin === true",
        ".remove": "$admin === true"
    }
}

const app = new express()
app.use(express.json())

function parseToken(token){
  return {
    admin: true,
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
  const { admin, userId } = parseToken(req.headers['Authorization'])

  const { action } = req.body

  const params = entry.parseParams(action, req.body)

  const injections = {
    $admin: admin,
    $userid: userId
  }

  const matched = await entry.validate({ ...params, injections })
  if (!matched) {
    return res.send({
      code: 4,
      data: 'permission denied'
    })
  }

  const data = await entry.execute(params)
  return res.send({
    code: 0,
    data
  })
})

app.listen(8080, () => console.log('listening on 8080'))
