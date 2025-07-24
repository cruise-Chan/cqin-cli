# Monoro-Scaffold ⚙️

> 一个 monorepo 脚手架，CLI 位于 `packages/cli`，用于快速初始化多包项目结构

[![Forks](https://img.shields.io/github/forks/cruiseqin/cqin-cli?style=social)](https://github.com/cruiseqin/cqin-cli/fork)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

## 目录

- [简介](#简介)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [CLI 使用指南](#cli-使用指南)
- [贡献指南](#贡献指南)
- [配置和测试](#配置和测试)
- [许可证](#许可证)
- [致谢](#致谢)
- [联系作者](#联系作者)

## 简介

这是一个 monorepo 风格的开源脚手架，主应用在 `packages/cli`，用于生成多包项目模板（如 React/Vue/Web 服务等）。集成常见配置（ESLint、Prettier、CI/CD），支持一键 scaffold 项目结构，适合团队协作和模块复用。

## 项目结构

```text
/
├── packages/
│   └── cli/               # 脚手架命令入口
│       ├── src/
│       ├── bin/cli.js
│       ├── package.json
│       └── README.md      # cli 模块专属文档
├── packages/
│   └── <other-package>/   # 可选的其他包
├── package.json           # root 工程
├── pnpm-workspace.yaml    # 或 yarn workspaces
├── tsconfig.json
├── .eslintrc
├── .prettierrc
└── LICENSE
```

## 快速开始
```bash
# 1. Fork 本仓库
git clone https://github.com/cruiseqin/cqin-cli.git
cd cqin-cli

# 2. 安装所有依赖
pnpm install

# 3. 构建 CLI 工具并全局链接 CLI（dev 环境）
cd packages/cli
npm start
npm link  # 只需执行一次，后续修改调试只需执行pnpm start

# 4. 创建新项目
cd 到目标目录，运行：
monoro init --template vue --name my-app
```

## CLI 使用指南
```bash
# 查看帮助
monoro --help

# 常用命令
monoro init \
  --template <vue|react|node> \
  --name <project-name> \
  [--packageManager <npm|pnpm|yarn>]

```

## 贡献指南
感谢社区贡献 👏

1. Fork 仓库

2. 创建新分支：git checkout -b feature/xxx

3. 提交改动：git commit -m "feat(cli): add new option"

4. 推送到你的 fork：git push origin feature/xxx

5. 发起 PR 到 main 分支，并指派 reviewer

## 配置和测试

```bash
# 构建代码
pnpm build

# 发布到npm仓库
npm publish --access public
```

## 许可证
本项目采用 MIT 许可证，详见 [LICENSE](./LICENSE)。

## 致谢
感谢所有贡献者，参考了以下资源：

Monorepo 最佳实践与工具比较 

## 联系作者
作者邮箱: 1070951750@qq.com