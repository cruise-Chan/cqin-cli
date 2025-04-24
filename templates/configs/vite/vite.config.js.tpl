import { defineConfig } from 'vite';
<% if (framework === 'React') { %>
import react from '@vitejs/plugin-react';
<% } else { %>
import vue from '@vitejs/plugin-vue';
<% } %>
import path from 'path';
// ESM环境获取__dirname
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    <% if (framework === 'React') { %>
    react()
    <% } else { %>
    vue({
      reactivityTransform: true // 启用响应性语法糖
    })
    <% } %>
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});