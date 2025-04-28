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
  css: {
    preprocessorOptions: {
      <%_ if (cssPreprocessor === 'Sass/SCSS') { _%>
      scss: {
       additionalData: `
          @use "@/styles" as *;
          @use "sass:meta";
        `,
        charset: false
      }
      <%_ } else if (cssPreprocessor === 'Less') { _%>
      less: {
        globalVars: {
          hack: `true; @import "@/styles/_variables.less";`
        }
      }
      <%_ } else if (cssPreprocessor === 'Stylus') { _%>
      stylus: {
        imports: [path.resolve(__dirname, 'src/styles/_variables.styl')]
      }
      <%_ } _%>
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});