
### 介绍

> 通过一套「访问控制规则」配置数据库访问，用一个 API 替代服务端 90% 的 APIs。

> 客户端使用 One API 提供的 SDK，像操作数据库那样，直接读写相应的数据即可。

> 使用 One API 可以让产品在 demo 期或发展初期的时候， 只投入极少的服务端工作，随着业务的发展， 逐渐有些 api 要改也不关系，可以按需增加传统的 api 来代替，两者完全不冲突，取决于客户端调用方式。

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

    客户端数据操作采取了「微信云开发」的接口设计。

@see 微信云开发接口文档： https://developers.weixin.qq.com/miniprogram/dev/wxcloud/reference-client-api/database/

#### 服务端代码示例

```js
const express = require('express')
const oneapi = require('one-api')
const rules = require('./rules.json')

// init one api entry
const db = {
  dbName: 'mydb',
  url: 'mongodb://localhost:27017/',
  connSettings: { }
}
const entry = new oneapi.Entry({ db })
entry.init()
entry.loadRules(rules)

// http server
const app = new express()
app.post('/entry', async (req, res) => {
    // your auth logics
    const { role, userId } = parseToken(req.headers['Authorization'])

    // prepare params
    const { action } = req.body
    const params = entry.parseParams(action, req.body)

    const injections = {
        $role: role,
        $userid: userId,
        $query: params.query,
        $data: params.data
    }

    // validate access
    const matched = await entry.validate({...params, injections})
    if(!matched){
        return res.status(403).send('permission denied')
    }

    // execute query
    const result = await entry.execute(params)
    return res.send(result)
})

// other apis
app.post('/payment', (req, res) => { /* ... */ })
app.post('/upload', (req, res) => { /* ... */ })

app.listen(8080)
```

#### 规则示例

##### 简单示例 1：简单博客

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

##### 简单示例 2：多用户博客

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

##### 复杂示例 1： 数据验证

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

##### 复杂示例 2：更高级的数据验证

> 场景介绍： 用户之间站内消息表访问规则

```json
{
    "messages": {
        ".read": "$userid && ($userid === $query.receiver || $userid === $query.sender)",
        ".update": {
            "condition": "$userid && $userid === $query.receiver",
            "data.valid": {
                "read": {"in": [true, false]}
            },
            "data.field": {"allow": ["read"]}
        },
        ".add": {
            "condition": "$userid && $userid === $data.sender",
            "data.valid": {
                "content": {"length": [1, 20480]},
                "receiver": {"exist": {"collection": "users", "field": "_id"}}
            },
            "data.field": {"allow": ["sender", "receiver", "content"]}
        },
        ".remove": false
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
