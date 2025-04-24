#!/usr/bin/env node
import { program } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import ora from 'ora';
import ejs from 'ejs';

import { fileURLToPath } from 'url';
// ESM环境获取__dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

program
  .version('1.0.0', '-v, --version')
  .arguments('<project-name>')
  .action(async (projectName) => {
    const spinner = ora().start('正在初始化项目...');
    
    try {
      // 1. 用户交互提问
      const answers = await inquirer.prompt([
        { type: 'list', name: 'framework', message: '选择框架:', choices: ['React', 'Vue'] },
        { 
          type: 'list', 
          name: 'version', 
          message: '版本:', 
          choices: (prev) => prev.framework === 'Vue' ? ['3.x', '2.x'] : ['17.x', '18.x'] 
        },
        { type: 'list', name: 'language', message: '语言:', choices: ['TypeScript', 'JavaScript'] },
        { type: 'list', name: 'builder', message: '构建工具:', choices: ['Vite', 'Webpack' ] }
      ]);

      // 2. 确定文件扩展名
      const extMap = {
        React: { main: answers.language === 'TypeScript' ? 'tsx' : 'jsx', app: 'jsx' },
        Vue: { main: answers.language === 'TypeScript' ? 'ts' : 'js', app: 'vue' }
      };
      const { main: mainExt, app: appExt } = extMap[answers.framework];

      // 3. 创建项目目录
      const targetPath = path.resolve(process.cwd(), projectName);
      if (fs.existsSync(targetPath)) {
        spinner.fail(`目录 ${chalk.red(projectName)} 已存在`);
        process.exit(1);
      }
      fs.mkdirSync(targetPath);

      // 4. 复制基础模板
      fs.copySync(path.join(__dirname, '../templates/base/public'), path.join(targetPath, 'public'));
      const srcDir = path.join(targetPath, 'src');
      fs.mkdirSync(srcDir);

      // 5. 生成入口文件
      const renderTemplate = (tplPath, data) => {
        const template = fs.readFileSync(tplPath, 'utf-8');
        return ejs.render(template, data);
      };

      // 处理主入口文件
      const mainContent = renderTemplate(
        path.join(__dirname, `../templates/base/src/main.${mainExt}.tpl`),
        { framework: answers.framework }
      );
      fs.writeFileSync(path.join(srcDir, `main.${mainExt}`), mainContent);

      // 处理组件文件
      spinner.text = '处理组件文件...';
      let appPath;
      if (answers.framework === 'Vue' && answers.version === '3.x' && answers.language === 'TypeScript') {
        appPath = path.join(__dirname, `../templates/base/src/App.vue3-ts.tpl`); 
      }else if (answers.framework === 'Vue' && answers.version === '3.x' && answers.language === 'JavaScript') {
        appPath = path.join(__dirname, `../templates/base/src/App.vue3.tpl`);
      }else {
        path.join(__dirname, `../templates/base/src/App.${appExt}.tpl`)
      }
      const appContent = renderTemplate(
        appPath,
        { 
          framework: answers.framework,
          msg: answers.framework === 'React' ? 'Hello React!' : 'Hello Vue!',
          language: answers.language
        }
      );
      fs.writeFileSync(path.join(srcDir, `App.${appExt}`), appContent);

      spinner.text = '生成构建配置...';
      // 6. 生成构建配置
      const configExt = answers.language === 'TypeScript' ? 'ts' : 'js';
      const configContent = renderTemplate(
        answers.builder === 'Webpack' ? path.join(__dirname, `../templates/configs/${answers.builder.toLowerCase()}/webpack.common.js.tpl`) :
        path.join(__dirname, `../templates/configs/${answers.builder.toLowerCase()}/vite.config.js.tpl`),
        { 
          framework: answers.framework,
          language: answers.language,
          ext: answers.language === 'TypeScript' ? 'ts' : 'js' 
        }
      );
      fs.writeFileSync(path.join(targetPath, answers.builder === 'Webpack' ?  `webpack.common.${configExt}` :  `vite.config.${configExt}`), configContent);

      // 7. 生成语言配置
      if (answers.language === 'TypeScript') {
        const tsConfig = renderTemplate(
          path.join(__dirname, '../templates/specials/tsconfig.json.tpl'),
          { framework: answers.framework }
        );
        fs.writeFileSync(path.join(targetPath, 'tsconfig.json'), tsConfig);
      }

      // 生成模板渲染文件index.html
      const renderTemplateFile = (targetPath, templatePath, data) => {
        const template = fs.readFileSync(
          path.join(__dirname, templatePath),
          'utf-8'
        );
        const content = ejs.render(template, data);
        fs.writeFileSync(
          path.join(targetPath, path.basename(templatePath).replace('.tpl', '')),
          content
        );
      };
      spinner.text = '生成模板渲染文件...';
      renderTemplateFile(
        path.join(targetPath, 'public'),
        '../templates/base/public/index.html',
        { 
          projectName,
          framework: answers.framework,
          builder: answers.builder,
          ext: answers.language === 'TypeScript' ? 'ts' : 'js' 
        }
      );

      // 8. 生成package.json
      const pkg = {
        name: projectName,
        version: '1.0.0',
        scripts: {
          dev: answers.builder === 'Vite' ? 'vite' : 'webpack serve --config webpack.dev.js',
          build: answers.builder === 'Vite' ? 'vite build' : 'webpack build --config webpack.prod.js'
        },
        dependencies: getDependencies(answers),
        devDependencies: getDevDependencies(answers)
      };
      fs.writeFileSync(path.join(targetPath, 'package.json'), JSON.stringify(pkg, null, 2));

      // 9. 安装依赖
      spinner.text = '正在安装依赖...';
      execSync('npm install', { cwd: targetPath, stdio: 'inherit' });

      spinner.succeed(`
        项目创建成功！运行以下命令：
        ${chalk.cyan(`cd ${projectName}`)}
        ${chalk.cyan('npm run dev')}
      `);
    } catch (err) {
      spinner.fail(`创建失败: ${chalk.red(err.message)}`);
      process.exit(1);
    }
  });

program.parse(process.argv);

// 动态生成依赖
function getDependencies(answers) {
  const deps = {};
  if (answers.framework === 'React') {
    deps.react = answers.version === '18.x' ? '^18.2.0' : '^17.0.2';
    deps['react-dom'] = deps.react;
  } else {
    deps.vue = answers.version === '3.x' ? '^3.3.4' : '^2.7.14';
  }
  if (answers.language === 'TypeScript') {
    deps.typescript = '^5.0.4';
    if (answers.framework === 'React') deps['@types/react'] = '^18.2.15';
  }
  return deps;
}

function getDevDependencies(answers) {
  const devDeps = {};
  if (answers.builder === 'Vite') {
    devDeps.vite = '^4.4.5';
    if (answers.framework === 'React') devDeps['@vitejs/plugin-react'] = '^4.0.3';
    if (answers.framework === 'Vue') {
      devDeps['@vitejs/plugin-vue'] = answers.version === '3.x' ? '^4.2.3' : '^2.3.4';
    }
  } else {
    devDeps.webpack = '^5.88.2';
    devDeps['webpack-cli'] = '^5.1.4';
    devDeps['webpack-dev-server'] = '^4.15.1';
    if (answers.framework === 'React') {
      devDeps['@babel/preset-react'] = '^7.22.5';
      devDeps['babel-loader'] = '^9.1.2';
    }
    if (answers.framework === 'Vue') {
      devDeps['vue-loader'] = answers.version === '3.x' ? '^17.2.2' : '^15.12.1';
      if (answers.version === '2.x') devDeps['vue-template-compiler'] = '^2.7.14';
    }
  }
  return devDeps;
}