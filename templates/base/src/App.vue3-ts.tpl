<script setup lang="ts">
import { ref } from 'vue'

interface Message {
  text: string
}

const msg = ref<Message>({ text: '<%= msg %>' })
const count = ref<number>(0)
</script>

<template>
  <div class="app">
    <h1>{{ msg.text }}</h1>
  </div>
</template>

<style scoped>
.app {
  color: #42b983;
}
.greeting {
  <% if (cssPreprocessor === 'Sass/SCSS') { %>
  &-text {
    color: blue;
  }
  <% } else { %>
  color: red;
  <% } %>
}
</style>