import postcssPresetEnv from 'postcss-preset-env'
import cssnano from 'cssnano'
import { defineConfig } from 'postcss-load-config'

export default defineConfig(async ({ env }) => {
  const isProduction = env === 'production'

  const plugins = [
    postcssPresetEnv({
      autoprefixer: { grid: true },
      features: {
        'nesting-rules': true
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