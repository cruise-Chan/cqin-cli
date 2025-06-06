<script setup>
import { ref } from 'vue'

const msg = ref('<%= msg %>')
</script>

<template>
  <div class="app">
    <h1>{{ msg }}</h1>
  </div>
</template>

<script setup>
// 组合式 API 示例
const count = ref(0)
</script>

<style scoped>
.app {
  color: #42b983;
}
</style>