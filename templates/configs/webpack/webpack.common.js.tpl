import path from 'path';
import { fileURLToPath } from 'url';
<% if (framework === 'Vue') { %>
import { VueLoaderPlugin } from 'vue-loader';
<% } %>

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
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
      },
      <% } %>
      <% if (cssPreprocessor !== 'CSS') { %>
      {
        test: /\.<%= styleExt %>$/,
        use: [
          'style-loader',
          'css-loader',
          <% if (cssPreprocessor === 'Sass/SCSS') { %>
          'sass-loader'
          <% } else if (cssPreprocessor === 'Less') { %>
          'less-loader'
          <% } else if (cssPreprocessor === 'Stylus') { %>
          'stylus-loader'
          <% } %>
        ]
      },
      <% } %>
    ]
  },
  plugins: [
    <% if (framework === 'Vue') { %>new VueLoaderPlugin()<% } %>
  ]
};