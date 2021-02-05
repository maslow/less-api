
## 运行本例

### 运行服务端

1. 启动 MongoDb 

```sh
 docker run -p 27017:27017 --name mongotest -d mongo
```

2. 启动 less-api server

```sh
node ./app.js
```