<template>
  <div class="<%= styleLang === 'scss' ? 'home-container' : 'home' %>">
    <h1>Welcome to Home</h1>
    <% if (needRouter) { %>
    <nav>
      <router-link to="/about">Go to <%= name %></router-link>
    </nav>
    <% } %>
  </div>
</template>

<% if (language === 'TypeScript') { %>
import { ref } from 'vue'
<script setup lang="ts">
// TS逻辑示例
const count = ref(0)
</script>
<% } else { %>
<script setup>
const count = ref(0)
</script>
<% } %>

<style <% if (cssPreprocessor !== 'CSS') { %>lang="<%= styleLang %>"<% } %>>
<% if (cssPreprocessor === 'Sass/SCSS') { %>
@use "@/styles" as v;
.home-container {
  padding: 2rem;
  
  h1 {
    color: v.$primary-color;
  }

  nav {
    margin-top: 1rem;
    a { color: blue; }
  }
}
<% } else if (cssPreprocessor === 'Less') { %>
.home {
  padding: 2rem;

  h1 {
    color: @primary-color;
  }

  nav {
    margin-top: 1rem;
    a { color: blue; }
  }
}
<% } else { %>
.home {<template>
  <div :class="$style.home">
    <h1>Welcome to Home</h1>
    <% if (needRouter) { %>
    <router-link to="/about">About <%= name %></router-link>
    <% } %>
  </div>
</template>

<% if (language === 'TypeScript') { %>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

@Component
export default class Home extends Vue {
  private count = 0
}
</script>
<% } else { %>
<script>
export default {
  data() {
    return {
      count: 0
    }
  }
}
</script>
<% } %>

<style <% if (cssPreprocessor !== 'CSS') { %>lang="<%= styleLang %>"<% } %> module>
<% if (cssPreprocessor === 'Sass/SCSS') { %>
.home {
  h1 {
    font-size: 2em;
    color: $vue-green;
  }
}
<% } else { /* CSS */ %>
.home h1 {
  color: #42b983;
}
<% } %>
</style>
  padding: 2rem;
  text-align: center;

  h1 {
    color: #42b983;
  }

  nav {
    margin-top: 1rem;
  }
  
  a {
    color: #2c3e50;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}
<% } %>
</style>