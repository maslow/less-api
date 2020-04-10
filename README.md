![](https://github.com/Maslow/less-api/workflows/release/badge.svg)

## 介绍

    通过一套「访问控制规则」配置数据库访问，用一个 API 替代服务端 90% 的 APIs。

    客户端使用 `less-api` 提供的 SDK，像在服务端操作数据库那样，在客户端直接读写相应的数据即可。

    `less-api` 支持运行在自建服务器环境、腾讯云\阿里云云开发、uniCloud、微信小程序云开发。

    使用 `less-api` 可以让产品在 demo 期或发展初期的时候， 只投入极少（甚至0）服务端开发工作，
    随着业务的发展，可以按需增加传统的 api 来代替，两者完全不冲突，取决于客户端调用方式。


## 谁适合使用 less-api ？

### 1. `腾讯云、阿里云` 云开发的开发者

    云开发厂商接口互不兼容，功能互有圆缺， `less-api` 可屏蔽平台之间的差异，平滑迁移：

    1. 腾讯云开发客户端连数据库支持很强大，阿里云较弱且和腾讯接口完全不同，应用完全依赖云平台，无法切换

    2. 腾讯云没有对app/支持宝、头条、百度等小程序提供客户端SDK，仅限于微信小程序和H5，阿里云也类似

    3. 根据业务的发展情况，从云开发切换到自建服务器，只能重新开发

    而使用 `less-api` 能平滑的在各云开发平台与自建服务器上迁移，抹平差异，获得更好的开发体验。

    开发者使用阿里或腾讯的云开发服务，仅将 `less-api` 应用在他们云开发环境即可。
    
    `less-api` 灵活小巧，未来重构扩展没有其它副作用，甚至可逐步的去除 `less-api`，与应用之间藕合度很低。

### 2. Uni-app 或 UniCloud 的开发者

    Uni-app 开发者通常是有跨平台需求的，基于腾讯/阿里云开发需要在开发体验上做出极大取舍。

    UniCloud 开发者，期望 UniCloud 能抹平云厂商的差异性，以实现跨端跨平台，但当前 UniCloud 还很不成熟，
    重要的是 UniCloud 不支持客户端访问数据库，牺牲了云开发的便捷：

    1. UniCloud 并没有完全抹除云平台的差异，开发者在 UniCloud 上还是要选择阿里云或腾讯云
    2. UniCloud 为了适配不同厂商，抛弃了很多厂商重要的功能特点，开发体验大打折扣
    3. UniCloud 是完全基于阿里/腾讯的云开发服务实现的，并不是基于阿里/腾讯的基础云自行实现的云开发平台，
       以后注定要受累于两个平台无尽的适配工作中。

    因此，`less-api` 也是对 UniCloud 的一个很好的补充，使用 `less-api` 不仅能解决以上问题，
    还保留了未来无缝迁移至阿里/腾讯云或者自建服务器的能力。


### 3. 个人开发者、初创创业团队

    无论你使用云开发还是自建服务器环境，在产品初期基于 `less-api` 可以极大减少服务端API的数量，
    根据我们的实践经验，初期能节约 90% 的服务端API。

    因此，在产品初期，团队可以专注于产品业务本身，快速推出最小可用产品(MVP)，快速进行产品、市场验证。

    随着业务的发展，可将部分复杂、性能、安全敏感的 API 用传统方式实现，`less-api` 继续承担一般的数据请求。

    即便是应用重构，也可逐个替换原 `less-api` 负责的请求，重构过程不影响应用正常运行，持续发布的方式重构。


### 3.复杂架构的项目

    在复杂架构的项目中， `less-api` 可以充当其中一个或多个微服务，承载部分数据操作请求。

## 初心场景

>最初 `less-api` 就是出于以下场景而设计的：

- 用于快速开发 MVP，专注于客户端业务，极大程度减少服务端开发工作量
- 用于云开发（BaaS）服务中，屏蔽云厂商的环境差异，亦方便由 BaaS 到自建 Server 的迁移

## 使用示例

```sh
    npm install less-api
```

### 服务端代码示例

```js
const app = require('express')()
const { Entry, MongoAccessor } = require('less-api')
app.use(express.json())

// design the access control rules
const rules = {
    categories: {
        ".read": true,
        ".update": "$admin == true",
        ".add": "$admin == true",
        ".remove": "$admin == true"
    }
}

// init the less-api Entry & Db Accessor

const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    poolSize: 10
}
// @see https://mongodb.github.io/node-mongodb-native/3.3/reference/ecmascriptnext/connecting/
const accessor = new MongoAccessor('mydb', 'mongodb://localhost:27017', options)

const entry = new Entry(accessor)
entry.init()
entry.loadRules(rules)

app.post('/entry', async (req, res) => {
  const { admin, uid } = parseToken(req.headers['authorization'])

  // parse params
  const params = entry.parseParams(req.body)

  const injections = {
    $admin: admin,
    $userid: uid
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
```

### 客户端使用

详细请移步 [Less API Javascript Client SDK](https://github.com/Maslow/less-api-client-js.git)

```sh
    npm install less-api-client
```

```js
const cloud = require('less-api-client').init({
    entryUrl: 'http://localhost:8080/entry',
    getAccessToken: () => localStorage.getItem('access_token')，
    environment: 'h5',
    // environment: 'uniapp', // uniapp
    // environment: 'wxmp'  // 微信小程序
})

const db = cloud.database()

// 查询文档
const cates = await db.collection('categories').get()

// 条件查询
const articles = await db.collection('articles')
    .where({status: 'published'})
    .orderBy({createdAt: 'asc'})
    .offset(0)
    .limit(20)
    .get()

// 更新
const updated = await db.collection('articles').doc('the-doc-id').update({
    title: 'new-title'
})
```

更多使用参考[客户端使用文档](https://github.com/Maslow/less-api-client-js/blob/master/README.md)

### 数据访问安全规则示例

#### 简单示例 1：简单博客

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

#### 简单示例 2：多用户博客

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

#### 复杂示例 1： 数据验证

```json
{
    "articles": {
        ".add": {
            "condition": "$userid && data.createdBy === $userid",
            "data": {
                "title": {"length": [1, 64], "required": true},
                "content": {"length": [1, 4096]},
                "like": { "number": [0,], "default": 0}
            }
        },
        ".remove": "$userid === query.createBy || $admin === true"
    }
}
```

#### 复杂示例 2：更高级的数据验证

> 场景介绍： 用户之间站内消息表访问规则

```json
{
    "messages": {
        ".read": "$userid && ($userid === query.receiver || $userid === query.sender)",
        ".update": {
            "condition": "$userid && $userid === query.receiver",
            "data": {
                "read": {"in": [true, false]}
            }
        },
        ".add": {
            "condition": "$userid && $userid === data.sender",
            "data": {
                "content": {"length": [1, 20480], "required": true},
                "receiver": {"exists": {"collection": "users", "field": "_id"}},
                "read": { "in": [false], "default": false }
            }
        },
        ".remove": false
    }
}
```

## 运行测试

安装依赖

```sh
    npm i
    npm i mocha -g
```

### 单元测试

```sh
    mocha tests/units/*.test.js
```

### 数据库访问测试

使用 Docker 启动个测试数据库，等待mongo 启动成功

```sh
    docker pull mongo
    docker run -p 27017:27017 --name mongotest -d mongo
```

执行测试用例

```sh
    mocha tests/db/*.test.js
```

停止&删除 Mongo 实例

```sh
    docker rm -f mongotest
```

## doing & todo

- 实现「数据访问控制规则」  【Done】
- 提供 JS 版客户端 SDK: less-api-client-js 【Done】
- 支持 Uni-app 客户端 【Done】
- 支持 UniCloud 云开发环境 【Done】
- 实现服务端应用内数据操作事件，可订阅相应事件，触发更多自定义的业务逻辑
- 基于 Mongo 的`change watch`, 实现客户端可订阅数据变更通知，服务端通过 websocket 向客户端实时推送数据变更
- 提供 Android & iOS 客户端 SDK
- 支持 MySQL 等关系型数据库
