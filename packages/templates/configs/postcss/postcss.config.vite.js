import postcssPresetEnv from 'postcss-preset-env'
import cssnano from 'cssnano'
import pkg from 'postcss-load-config';
const { defineConfig } = pkg;


export default defineConfig(async ({ env }) => {
  const isProduction = env === 'production'

  const plugins = [
    postcssPresetEnv({
      autoprefixer: { grid: true },
      features: {
        'nesting-rules': true,
        // 'logical-properties-and-values': false, // 若项目无需兼容旧浏览器,请打开此行注释，可关闭 postcss-preset-env 的语法转换功能，仅保留前缀添加
      }
    })
  ]

  if (isProduction) {
    plugins.push(
      cssnano({
        preset: 'default'
      })
    )
  }

  return { plugins }
})