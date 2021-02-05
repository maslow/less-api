<template>
  <div>
    <h2>本页面展示 less-api 对 mongo 和 mysql 同时支持</h2>
    <input type="input" v-model="name" placeholder="新建目录名称" />
    <button @click="add">添加</button>

    <h3>Categories From MySQL</h3>
    <div class="cate" v-for="cate in categories" :key="cate.id">
      {{ cate.name }} <span @click="remove(cate.id)">x</span>
    </div>

    <h3>Categories From MongoDb</h3>

    <div class="cate" v-for="cate in categories2" :key="cate._id">
      {{ cate.name }} <span @click="remove2(cate._id)">x</span>
    </div>
  </div>
</template>

<script>
import { Cloud } from 'less-api-client'

// sql entry
const cloud = new Cloud({
  entryUrl: 'http://localhost:8080/entry',
  getAccessToken: () => null,
})

// mongo entry
const cloud2 = new Cloud({
  entryUrl: 'http://localhost:8081/entry',
  getAccessToken: () => null,
})

const db = cloud.database() // sql
const db2 = cloud2.database() // mongo

export default {
  data() {
    return {
      categories: [],
      name: '',
      categories2: [],
    }
  },
  async mounted() {
    this.load()
  },
  methods: {
    // 加载目录
    async load() {
      const r = await db.collection('categories').get()
      this.categories = r.data

      const r2 = await db2.collection('categories').get()
      this.categories2 = r2.data
    },
    // 添加目录
    async add() {
      await db.collection('categories').add({
        name: this.name,
        created_at: Math.floor(Date.now() / 1000),
      })

      await db2.collection('categories').add({
        name: this.name,
        created_at: Math.floor(Date.now() / 1000),
      })

      await this.load()
      this.name = ''
    },
    // 删除目录
    async remove(id) {
      await db.collection('categories').where({ id }).remove()
      await this.load()
    },
    // 删除目录(mongo)
    async remove2(id) {
      await db2.collection('categories').where({ _id: id }).remove()
      await this.load()
    },
  },
}
</script>

<style>
</style>