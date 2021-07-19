
### 启动客户端

```sh
npm intall
npm install -g @vue/cli

vue serve index.vue
vue serve both.vue
```


### 运行服务端

1. 启动 MongoDb 

```sh
 docker run -p 27017:27017 --name mongotest -d mongo
```

2. 启动 less-api server

```sh
node ./server.js
```