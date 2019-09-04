
### 介绍

> 通过一套「访问控制规则」配置数据库访问，用一个 API 替代服务端 90% 的 APIs。

### 使用示例

#### 客户端使用

```js
const OneApi = require('one-api-client-js')
const cloud = OneApi.init({
    url: 'http://localhost:8080/entry',
    getAccessToken: () => localStorage.getItem('access_token')
})

const db = cloud.database()

// query documents
const cates = await db.collection('categories').get()

// query a document
const cate = await db.collection('categories').doc('the-doc-id').get()

// query with options
const articles = await db.collection('articles')
    .where({})
    .orderBy({createdAt: 'asc'})
    .offset(0)
    .limit(20)
    .get()

// count documents
const total = await db.collection('articles').where({createdBy: 'the-user-id'}).count()

// update document
const updated = await db.collection('articles').doc('the-doc-id').update({
    data: {
        title: 'new-title'
    }
})

// add a document
const created = await db.collection('articles').add({
  data: {
    title: "one api database",
    content: 'less api more life',
    tags: [
      "cloud",
      "database"
    ],
    createdAt: new Date("2019-09-01)
  }
})

// delete a document
const removed = await db.collection('articles').doc('the-doc-id').remove()
```

#### 服务端代码示例

```js
const express = require('express')
const oneapi = require('oneapi')
const rules = require('./rules.json')

const app = new express()

const db = {
  dbName: 'mydb',
  url: 'mongodb://localhost:27017/',
  connSettings: { }
}
const entry = new oneapi.Entry({ db })
entry.init()
entry.loadRules(rules)

app.post('/entry', async (req, res) => {
  const { role, userId } = parseToken(req.headers['Authorization'])

  const { action } = req.body
  const params = entry.parseParams(action, req.body)

  const injections = {
    $role: role,
    $userid: userId,
    $query: params.query,
    $data: params.data
  }

  const matched = await entry.validate({...params, injections})
  if(!matched){
      return res.status(403).send('permission denied')
  }

  const result = await entry.execute(params)
  return res.send(result)
})

// other apis
app.post('/payment', (req, res) => { /* ... */ })
app.post('/upload', (req, res) => { /* ... */ })

app.listen(8080)
```

#### 规则示例

##### 示例一：简单博客

```json
{
    "categories": {
        ".read": true,
        ".update": "$admin === true",
        ".add": "$admin === true",
        ".remove": "$admin === true"
    },
    "articles": {
        ".read": true,
        ".update": "$admin === true",
        ".add": "$admin === true",
        ".remove": "$admin === true"
    }
}
```

##### 示例二：多用户博客

```json
{
    "articles": {
        ".read": true,
        ".update": "$userid && $userid === $query.createdBy",
        ".add": "$userid && $data.createdBy === $userid",
        ".remove": "$userid === $query.createBy || $admin === true"
    }
}
```

##### 示例三： 数据验证

```json
{
    "articles": {
        ".add": {
            "condition": "$userid && $data.createdBy === $userid",
            "data.valid": {
                "title": {"length": [1, 64]},
                "content": {"length": [1, 4096]},
            },
            "data.field": {"allow": ["title", "content"]},
        },
        ".remove": "$userid === $query.createBy || $admin === true"
    }
}
```

### 测试

```sh
    npm install
    npm run test
```

### doing & todo

- 实现「数据访问控制规则」
- 提供 JS 版客户端 SDK: oneapi-client-js
- 实现服务端应用内数据操作事件，可订阅相应事件，触发更多自定义的业务逻辑
- 基于 Mongo 的`change watch`, 实现客户端可订阅数据变更通知，服务端通过 websocket 向客户端实时推送数据变更
- 提供 Android & iOS 客户端 SDK
- 支持 MySQL 等关系型数据库
