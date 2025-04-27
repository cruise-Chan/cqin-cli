import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
<% if (framework === 'Vue') { %>
import { VueLoaderPlugin } from 'vue-loader';<% } %>
<% if (cssPreprocessor === 'Sass/SCSS') { %>
import sass from 'sass';<% } %>

// 基础配置
const commonConfig = {
  entry: './src/main.<%= ext %>',
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  module: {
    rules: [
      <% if (framework === 'React') { %>
      {
        test: /\.(jsx|tsx)$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },<% } else { %>
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          reactivityTransform: true
        }
      },<% } %>
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      <% if (cssPreprocessor !== 'CSS') { %>
      {
        test: /\.<%= styleExt %>$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: '<%= loaderName %>',
            options: {
              <%_ if (cssPreprocessor === 'Sass/SCSS') { _%>
              implementation: sass,
              sassOptions: {
                api: 'modern',
                includePaths: [path.resolve(__dirname, 'src/styles')]
              }<% } else if (cssPreprocessor === 'Less') { _%>
              lessOptions: {
                globalVars: {
                  hack: `true; @import "~@/styles/_variables.less";`
                }
              }<% } else if (cssPreprocessor === 'Stylus') { _%>
              stylusOptions: {
                import: [path.resolve(__dirname, 'src/styles/_variables.styl')]
              }<% } _%>
            }
          }
        ]
      },<% } %>
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource'
      }
    ]
  },
  plugins: [<% if (framework === 'Vue') { %>
    new VueLoaderPlugin()<% } %>
  ],
  resolve: {
    extensions: ['.<%= ext %>', 
    <% if (cssPreprocessor !== 'CSS') { %>'.<%= styleExt %>'<% } %>
    ].filter(Boolean),
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
};

export default commonConfig;