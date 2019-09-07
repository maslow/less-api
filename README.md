
### 介绍

通过一套「访问控制规则」配置数据库访问，用一个 API 替代服务端 90% 的 APIs。

客户端使用 `less-api` 提供的 SDK，像操作数据库那样，直接读写相应的数据即可。

使用 `less-api` 可以让产品在 demo 期或发展初期的时候， 只投入极少的服务端工作，随着业务的发展，可以按需增加传统的 api 来代替，两者完全不冲突，取决于客户端调用方式。

### 场景

- 用于快速开发 MVP，专注于客户端业务，极大程度减少服务端开发工作量
- 用于云开发（BaaS）服务中，屏蔽云厂商的环境差异，亦方便由 BaaS 到自建 Server 的迁移

### 使用示例

```sh
    npm install less-api
```

#### 服务端代码示例

```js
const app = require('express')()
const { Entry } = require('less-api')

const rules = {
    categories: {
        ".read": true,
        ".update": "$admin === true",
        ".add": "$admin === true",
        ".remove": "$admin === true"
    }
}

app.use(express.json())

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
```

#### 客户端使用

[Javascript client sdk](https://github.com/Maslow/less-api-client-js.git)

```sh
    npm install less-api-client
```

```js
const cloud = require('less-api-client').init({
    url: 'http://localhost:8080/entry',
    getAccessToken: () => localStorage.getItem('access_token')
})

const db = cloud.database()

// query documents
const cates = await db.collection('categories').get()

// query with options
const articles = await db.collection('articles')
    .where({})
    .orderBy({createdAt: 'asc'})
    .offset(0)
    .limit(20)
    .get()

// update document
const updated = await db.collection('articles').doc('the-doc-id').update({
    data: {
        title: 'new-title'
    }
})
```

客户端数据操作采取了「微信云开发」的接口设计。

@see 微信云开发接口文档： https://developers.weixin.qq.com/miniprogram/dev/wxcloud/reference-client-api/database/

#### 数据访问安全规则示例

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
        ".update": "$userid && $userid === query.createdBy",
        ".add": "$userid && data.createdBy === $userid",
        ".remove": "$userid === query.createBy || $admin === true"
    }
}
```

##### 复杂示例 1： 数据验证

```json
{
    "articles": {
        ".add": {
            "condition": "$userid && data.createdBy === $userid",
            "data.valid": {
                "title": {"length": [1, 64]},
                "content": {"length": [1, 4096]},
            },
            "data.field": {"allow": ["title", "content"]},
        },
        ".remove": "$userid === query.createBy || $admin === true"
    }
}
```

##### 复杂示例 2：更高级的数据验证

> 场景介绍： 用户之间站内消息表访问规则

```json
{
    "messages": {
        ".read": "$userid && ($userid === query.receiver || $userid === query.sender)",
        ".update": {
            "condition": "$userid && $userid === query.receiver",
            "data.valid": {
                "read": {"in": [true, false]}
            },
            "data.field": {"allow": ["read"]}
        },
        ".add": {
            "condition": "$userid && $userid === data.sender",
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

### 运行测试

安装依赖

```sh
    npm i
    npm i mocha -g
```

#### 单元测试

```sh
    mocha tests/units/*
```

#### 数据库访问测试

使用 Docker 启动个测试数据库，等待mongo 启动成功

```sh
    docker pull mongo
    docker run -p 27017:27017 --name mongodb_for_test -d mongo
```

执行测试用例

```sh
    mocha tests/db/*
```

停止&删除 Mongo 实例

```sh
    docker rm -f mongodb_for_test
```

### doing & todo

- 实现「数据访问控制规则」
- 提供 JS 版客户端 SDK: less-api-client-js
- 实现服务端应用内数据操作事件，可订阅相应事件，触发更多自定义的业务逻辑
- 基于 Mongo 的`change watch`, 实现客户端可订阅数据变更通知，服务端通过 websocket 向客户端实时推送数据变更
- 提供 Android & iOS 客户端 SDK
- 支持 MySQL 等关系型数据库
