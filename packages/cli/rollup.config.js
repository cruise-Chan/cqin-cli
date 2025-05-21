import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.js',  // 入口文件
  output: {
    dir: 'dist',          // 输出目录
    format: 'esm',        // 模块格式（esm/cjs/umd）
    sourcemap: true       // 生成 sourcemap
  },
  plugins: [
    terser(),         // 压缩代码
    replace({
        // 设置需要替换的变量
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production')
    })
  ]
};