<template>
  <div class="<%= styleLang === 'scss' ? 'home-container' : 'home' %>">
    <h1>Welcome to <%= name %></h1>
    <% if (needRouter) { %>
    <nav>
      <router-link to="/about">Go to <%= name %></router-link>
    </nav>
    <% } %>
  </div>
</template>

<% if (language === 'TypeScript') { %>
<script setup lang="ts">
import { ref } from 'vue'
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
.home {
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