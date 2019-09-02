
### 介绍

> 通过一套通过访问控制语言配置服务端数据访问 API.

### 使用示例

```js
const express = require('exrepss')
const noapi = require('noapi')
const rules = require('./rules.json')

const app = new express()
const entry = new noapi.Entry(config)
entry.loadRules(rules)

// one api entry
app.post('/entry', async (req, res) => {
    const { role, userId, appid } = parseToken(req.body.token)
    const { collection, action, query, data, options } = req.body

    const injections = {  
        $role: role,
        $userid: userId,
        $appid: appid,
        $query: query,
        $data: data,
        $queryOptions: options
    }
  
    const { valid } = await entry.validate(collection, action, injections)
    if(!valid){
        return res.status(403).send('permission denied');
    }

    const params = { collection, query, data, options }
    const result = await entry.execute(params)  

    return result
}

// other apis
app.post('/payment', (req, res) => {
    // ...
})

app.post('/upload', (req, res) => {
    // ...
})

app.listen(8080)
```

### 规则示例

#### 单用户博客示例

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

#### 多用户博客示例

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
