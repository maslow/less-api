
### 介绍

> 通过一套通过访问控制语言配置服务端数据访问 API.

### 使用示例

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

    const params = { collection, query, data, options }
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

app.listen(8080)
```

#### 规则示例

##### 单用户博客示例

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
        ".update": {
            "condition": "$admin === true",
            "data.valid": {
                "title": {"length": [1, 64]},
                "content": {"length": [1, 20480]}
            },
            "data.field": {"allow": ["title", "content"]}
        },
        ".add": {
            "condition": "$admin === true",
            "data.valid": {
                "title": {"length": [1, 64]},
                "content": {"length": [1, 20480]}
            },
            "data.field": {"allow": ["title", "content"]}
        },
        ".remove": "$admin === true"
    }
}
```

##### 多用户博客示例

```json
{
    "articles": {
        ".read": true,
        ".update": {
            "condition": "$userid && $userid === $query.createdBy",
            "data.valid": {
                "title": {"length": [1, 64]},
                "content": {"length": [1, 20480]}
            },
            "data.field": {"allow": ["title", "content"]}
        },
        ".add": {
            "condition": "$userid && $data.createdBy === $userid",
            "data.valid": {
                "title": {"length": [1, 64]},
                "content": {"length": [1, 20480]}
            },
            "data.field": {"allow": ["title", "content"]},
            "rateLimit": {"identifier": "$userid", "times":3, "duration": 300, "msg": "每10分钟限调3次"}
        },
        ".remove": "$userid === $query.createBy || $admin === true"
    },
    "messages": {
        ".read": "$userid && ($userid === $query.receiver || $userid === $query.sender)",
        ".update": {
            "condition": "$userid && $userid === $query.receiver",
            "data.valid": {
                "read": {"in": [true, false]}
            },
            "data.fields": {"allow": ["read"]}
        },
        ".add": {
            "condition": "$userid && $userid === $query.sender",
            "data.validate": {
                "content": {"length": [1, 20480]},
                "receiver": {"exist": {"collection": "users", "field": "_id"}}
            },
            "data.fields": {"allow": ["sender", "receiver", "content"]},
            "rateLimit": {"identifier": "$userid", "times":3, "duration": 300, "msg": "每10分钟限调3次"}
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

- 实现当前确定的「数据访问规则」
- 提供 JS 版客户端 SDK: oneapi-client-js
- 实现 `change watch`, 客户端可订阅数据变更通知，服务端通过 websocket 向客户端实时推送数据变更
- 提供 Android & iOS 客户端 SDK
- 支持 MySQL 等关系型数据库
