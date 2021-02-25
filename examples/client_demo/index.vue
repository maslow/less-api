<template>
  <div>
    <h3>Categories</h3>
    <input type="input" v-model="name" placeholder="新建目录名称" />
    <button @click="add">添加</button>

    <br />
    <div class="cate" v-for="cate in categories" :key="cate.id">
      {{ cate.name }} <span @click="remove(cate.id)">x</span>
    </div>
  </div>
</template>

<script>
import { Cloud } from 'less-api-client'

const cloud = new Cloud({
  entryUrl: 'http://47.96.236.219:19000/admin-entry',
  getAccessToken: () => "9b34131c-50b0-498c-acb1-fe2810c0e8e4",
})

const db = cloud.database()

export default {
  data() {
    return {
      categories: [],
      name: '',
    }
  },
  async mounted() {
    this.load()
  },
  methods: {
    // 加载目录
    async load() {
      const { data } = await db.collection('categories').get()
      this.categories = data
    },
    // 添加目录
    async add() {
      await db.collection('categories').add({
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
  },
}
</script>

<style>
</style>