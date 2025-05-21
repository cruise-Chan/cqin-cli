#!/usr/bin/env node
import { program } from "commander";

import { initCommand } from './commands/init.js';

import { execSync } from 'child_process'
import path from "node:path";
import fs from "fs-extra";

program
    .version("1.0.14", "-v, --version")

program
    .command('create')
    .arguments("<project-name>")
    .action(initCommand);

let hasWebpackConfigPathDev;
let hasWebpackConfigPathProd;
// 统一处理构建命令
function runBuildCommand(command, mode, userArgs = []) {
    try {
        const buildTool = detectBuildTool();
        let baseCommand;

        switch (buildTool) {
            case 'vite':
                baseCommand = `vite ${command}`;
                break;
            case 'webpack':
                baseCommand = `webpack ${mode === 'start' ?
                    `serve ${hasWebpackConfigPathDev ? '--config webpack.dev.js' : ''}` : `build ${hasWebpackConfigPathProd ? '--config webpack.prod.js' : ''}`}`;
                break;
            default:
                throw new Error('不支持的构建工具');
        }
        // 组合基础命令和用户参数（安全处理）
        const fullCommand = [baseCommand, ...userArgs].join(' ');

        console.log(fullCommand, 'fullCommand')

        execSync(fullCommand, { stdio: 'inherit' });
    } catch (error) {
        console.error(`执行失败: ${error.message}`);
        process.exit(1);
    }
}

program
    .command('start')
    .description('启动开发服务器')
    .allowUnknownOption()
    .action(() => {
        const args = process.argv.slice(process.argv.indexOf('start') + 1);
        runBuildCommand('', 'start', args);
    });

program
    .command('build')
    .description('构建生产包')
    .allowUnknownOption()
    .action(() => {
        const args = process.argv.slice(process.argv.indexOf('build') + 1);
        runBuildCommand('build', 'build', args);
    });

program.parse(process.argv);


// 检测项目使用的构建工具（Vite 或 Webpack）
function detectBuildTool(projectPath = process.cwd()) {
    console.log(projectPath, 'projectPath')
    const viteConfigPath = path.join(projectPath, 'vite.config.js');
    const viteConfigPathTs = path.join(projectPath, 'vite.config.ts');
    const webpackConfigPath = path.join(projectPath, 'webpack.config.js');
    const webpackConfigPathDev = path.join(projectPath, 'webpack.dev.js');
    const webpackConfigPathProd = path.join(projectPath, 'webpack.prod.js');
    if (fs.existsSync(webpackConfigPathDev)) {
        hasWebpackConfigPathDev = true
    }
    if (fs.existsSync(webpackConfigPathProd)) {
        hasWebpackConfigPathProd = true
    }
    if (fs.existsSync(viteConfigPath) || fs.existsSync(viteConfigPathTs)) {
        return 'vite';
    } else if (fs.existsSync(webpackConfigPath) || fs.existsSync(webpackConfigPathDev) || fs.existsSync(webpackConfigPathProd)) {
        return 'webpack';
    } else {
        throw new Error('未检测到 Vite 或 Webpack 配置文件，请确保项目已初始化');
    }
}