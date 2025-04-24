const path = require('path');
<% if (framework === 'Vue') { %>
const { VueLoaderPlugin } = require('vue-loader');
<% } %>
// ESM环境获取__dirname
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

module.exports = {
  entry: './src/main.<%= ext %>',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      <% if (framework === 'React') { %>
      {
        test: /\.(jsx|tsx)$/,
        use: 'babel-loader'
      }
      <% } else { %>
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          reactivityTransform: true
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
      <% } %>
    ]
  },
  plugins: [
    <% if (framework === 'Vue') { %>new VueLoaderPlugin()<% } %>
  ]
};