 # cqin-cli - React/Vue 项目脚手架

## 简介
### 🚀 现代化多框架前端项目脚手架工具
`cqin-cli` 是一个高度可定制的现代化前端项目脚手架工具，支持快速生成 React 和 Vue 技术栈的初始化项目。提供丰富的配置选项，集成最新技术生态，助力项目快速启动。


## 目录

- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [功能配置](#功能配置)
- [开发命令](#开发命令)
- [测试指南](#测试指南)
- [代码规范](#代码规范)
- [依赖安装要求](#依赖安装要求)
- [常见问题](#常见问题)
- [贡献指南](#贡献指南)
- [许可证](#许可证)
- [联系作者](#联系作者)

---


## 特性

### 核心能力
- 🌈 双框架支持：React (17+/18+) / Vue (2.x/3.x)
- 🛠️ 构建工具：Vite / Webpack 双模式
- 💡 智能模板：根据选项动态生成最佳实践代码

### 技术生态
- 🧩 插件系统：按需集成路由/状态管理/测试等
- 🎨 UI 框架：Ant Design/Element Plus 开箱即用
- 📦 预处理器：Sass/SCSS/Less/Stylus 全面支持

### 工程化
- 🔒 代码规范：ESLint + Prettier + Stylelint
- 🔗 Git 集成：Husky + lint-staged 自动校验
- 🧪 测试方案：Cypress E2E 测试框架

---

## 快速开始

### 安装使用
```bash
npx cqin-cli@latest <project-name>
```

```bash
✔ 请输入项目名称 › my-app
? 选择框架 › - 使用方向键选择 - 
❯ React 
  Vue 

? 版本 › 
❯ 18.x
  17.x 

? 需要哪些功能 › - 空格选择/取消 - 
◉ TypeScript 
◯ Pinia/Vuex 
◯ 路由系统 
◯ 端到端测试
◯ 代码规范
```

## 项目结构
```bash
# react 项目为例
my-app/
├── src/
│   ├── assets/          # 静态资源
│   ├── components/      # 通用组件
│   ├── layouts/         # 布局组件
│   ├── views/           # 页面视图
│   ├── store/           # 状态管理
│   ├── router/          # 路由配置
│   ├── styles/          # 全局样式
│   └── main.{tsx|jsx}   # 入口文件
├── cypress/             # 测试用例
├── .husky/              # Git钩子
├── .eslintrc.js         # ESLint配置
├── vite.config.ts       # Vite配置
└── package.json
```

## 功能配置
### 路由系统
```js
// src/router/index.ts
export default createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/',
      component: () => import('@/views/Home.vue'),
      meta: { requiresAuth: true }
    }
  ]
})
```
### 状态管理 (Pinia)

```js
// src/store/user.ts
export const useUserStore = defineStore('user', {
  state: () => ({
    name: 'Guest',
    token: null
  }),
  actions: {
    async login(credentials) {
      // API调用逻辑
    }
  }
})
```

### 样式方案
```scss
// src/styles/_variables.scss
$primary-color: #1890ff;
$breakpoints: (
  mobile: 480px,
  tablet: 768px,
  desktop: 1200px
);
```
## 开发命令
### 基础命令
```bash
# 启动开发服务器
pnpm start

# 生产环境构建
pnpm run build

# 预览构建结果
pnpm run preview
```

### 代码质量
```bash
# 执行ESLint检查
pnpm run lint:js

# 修复样式问题
pnpm run lint:style

# 格式化所有文件
pnpm run format
```

### 测试相关
```bash
# 运行完整测试
pnpm run test:e2e

# 交互式测试开发
pnpm run test:e2e:dev

# CI环境测试
pnpm run test:e2e:ci
```

## 测试指南
### 测试用例示例
```js
// cypress/e2e/home.cy.js
describe('首页测试', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('应显示欢迎标语', () => {
    cy.get('h1').should('contain', 'Welcome')
  })

  it('导航栏应包含有效链接', () => {
    cy.get('nav a').should('have.length.at.least', 2)
  })
})
```
### 测试配置
```js
// cypress.config.js
module.exports = {
  e2e: {
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(on, config) {
      // 插件配置
    }
  }
}
```

## 代码规范
### ESLint 规则
```js
// .eslintrc.js
module.exports = {
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'vue/multi-word-component-names': 'off',
    'react-hooks/exhaustive-deps': 'error'
  }
}
```
### Git 提交规范
```bash
# 提交信息格式
<type>(<scope>): <subject>

# 示例
feat(router): 添加动态路由支持
fix(store): 修复用户信息缓存问题
```

### 依赖安装要求
此项目 **推荐使用 [pnpm](https://pnpm.io)** 管理依赖（否则可能引发错误），运行前请确保：
```bash
# 安装 pnpm（如果未安装）
npm install -g pnpm

# 安装依赖
pnpm install

## 常见问题
### 依赖安装失败
```
```bash
# 尝试以下步骤：
1. 升级Node.js到最新LTS版本
2. 清理缓存: npm cache clean --force
3. 删除lock文件: rm -rf package-lock.json yarn.lock
4. 重新安装: npm install --legacy-peer-deps
```
### 样式不生效
1. 检查预处理器loader是否安装

2. 确认样式文件导入路径正确

3. 查看Webpack/Vite配置中的样式处理规则

## 贡献指南
### 开发流程
1. Fork 主仓库

2. 创建特性分支
```bash
git checkout -b feat/awesome-feature
```
3. 提交符合规范的代码

4. 发起Pull Request

## 许可证
MIT License © 2025 cruise-Chan cqin-cli 开发者

> 更多文档请访问：[项目Wiki](https://github.com/cruise-Chan/cqin-cli/wiki)

## 联系作者
作者邮箱: 1070951750@qq.com