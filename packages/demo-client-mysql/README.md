
### 启动客户端

```sh
npm intall
npm install -g @vue/cli

vue serve index.vue
```


### 运行服务端

1. 启动 MySQL 

```sh
docker run --name mysqltest -e MYSQL_ROOT_PASSWORD=kissme -e MYSQL_DATABASE=testdb -d -p 3306:3306 mysql
```

2. 创建表: 将 init.sql 文件在 mysql 中执行

3. 启动 less-api server

```sh
node ./server.js
```