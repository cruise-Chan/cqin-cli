#!/usr/bin/env node
import { program } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";
import ora from "ora";
import ejs from "ejs";

import { fileURLToPath } from "url";
// ESM环境获取__dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

program
  .version("1.0.0", "-v, --version")
  .arguments("<project-name>")
  .action(async (projectName) => {
    let spinner;

    try {
      // 1. 用户交互提问
      const answers = await inquirer.prompt([
        {
          type: "list",
          name: "framework",
          message: "选择框架:",
          choices: ["React", "Vue"],
        },
        {
          type: "list",
          name: "version",
          message: "版本:",
          choices: (prev) =>
            prev.framework === "Vue" ? ["3.x", "2.x"] : ["18.x", "17.x" ],
        },
        {
          type: "list",
          name: "uiFramework",
          message: "选择UI框架:",
          choices: (prev) => {
            if (prev.framework === "React") {
              return ["Ant Design", "None"]
            } else {
              if (prev.version === "3.x") {
                return ["Ant Design Vue", "Element Plus", "None"]
              } else {
                return ["Ant Design Vue", "Element UI", "None"]
              }
            }
          }
        },
        {
          type: "list",
          name: "builder",
          message: "构建工具:",
          choices: ["Vite", "Webpack"],
        },
        {
          type: "checkbox",
          name: "plugins",
          message: "选择需要包含的功能：（↑/↓ 切换，空格选择， a 全选， 回车确认）",
          choices: (prev) => [
            {
              name: "TypeScript",
              checked: true,
              value: 'TypeScript',
            },
            prev.framework === 'Vue' &&
            {
              name: prev.version === '3.x' ? "Pinia (状态管理)" : "VueX (状态管理)",
              value: 'needStore',
            },
            {
              name: "Router (单页面应用开发)",
              value: 'needRouter',
            },
            {
              name: "端到端测试",
              value: 'needTest',
            },
            {
              name: "ESLint (错误预防)",
              value: 'needLint',
            },
          ].filter(Boolean),
        },
        // {
        //   type: "list",
        //   name: "language",
        //   message: "语言:",
        //   choices: ["TypeScript", "JavaScript"],
        // },
        // {
        //   type: "confirm",
        //   name: "needRouter",
        //   message: "是否集成路由?",
        //   default: true,
        // },
        // {
        //   type: "confirm",
        //   name: "needStore",
        //   message: "是否集成状态管理工具?",
        //   default: true,
        // },
        // {
        //   type: "confirm",
        //   name: "needLint",
        //   message: "是否集成代码规范(ESLint+Prettier+Stylelint)?",
        //   default: true,
        // },
        {
          type: "list",
          name: "testFramework",
          when: (answers) => answers.plugins.includes("needTest"),
          message: "请选择一个端到端的测试框架",
          choices: ["Cypress", "Playwright"],
        },
        {
          type: "list",
          name: "cssPreprocessor",
          message: "选择 CSS 预处理器:",
          choices: ["Sass/SCSS", "Less", "Stylus", "CSS"],
          default: "Sass/SCSS",
        },
      ]);
      spinner = ora().start("正在初始化项目...");

      answers.needRouter = answers.plugins.includes("needRouter");
      answers.needLint = answers.plugins.includes("needLint");
      answers.needStore = answers.plugins.includes("needStore");
      answers.language = answers.plugins.includes("TypeScript") ? "TypeScript" : "JavaScript";

      // 全局变量
      // 创建项目目录
      const targetPath = path.resolve(process.cwd(), projectName);
      if (fs.existsSync(targetPath)) {
        spinner.fail(`目录 ${chalk.red(projectName)} 已存在`);
        process.exit(1);
      }
      fs.mkdirSync(targetPath);
      const configExt = answers.language === "TypeScript" ? "ts" : "js";
      const srcDir = path.join(targetPath, "src");
      fs.mkdirSync(srcDir);

      // 2. 确定文件扩展名
      const extMap = {
        React: {
          main: answers.language === "TypeScript" ? "tsx" : "jsx",
          app: answers.language === "TypeScript" ? "tsx" : "jsx",
        },
        Vue: {
          main: answers.language === "TypeScript" ? "ts" : "js",
          app: "vue",
        },
      };
      const { main: mainExt, app: appExt } = extMap[answers.framework];

      // 4. 复制基础模板
      fs.copySync(
        path.join(__dirname, "../templates/base/public"),
        path.join(targetPath, "public")
      );

      // 5. 生成入口文件
      const renderTemplate = (tplPath, data) => {
        const template = fs.readFileSync(tplPath, "utf-8");
        return ejs.render(template, data);
      };

      // 处理主入口文件
      // 修改原有的mainContent生成逻辑
      const mainData = {
        framework: answers.framework,
        needRouter: answers.needRouter,
        language: answers.language,
        ext: mainExt,
        version: answers.version,
        needStore: answers.needStore,
        storePath: answers.framework === "Vue" && answers.version === "3.x"
          ? "pinia"
          : "vuex",
        ...answers,
      };

      if (answers.framework === "React" && answers.needRouter) {
        mainData.wrapperComponent = "BrowserRouter";
      }
      const mainContent = renderTemplate(
        path.join(__dirname, `../templates/base/src/main.${mainExt}.ejs`),
        mainData
      );
      fs.writeFileSync(path.join(srcDir, `main.${mainExt}`), mainContent);

      // 处理组件文件
      let appPath;
      // 新增：准备样式相关参数
      const styleExtMap = {
        "Sass/SCSS": "scss",
        Less: "less",
        Stylus: "styl",
        CSS: "css",
      };
      const styleExt = styleExtMap[answers.cssPreprocessor];
      const styleLang =
        answers.cssPreprocessor === "Sass/SCSS"
          ? "scss"
          : answers.cssPreprocessor.toLowerCase();

      if (
        answers.framework === "Vue" &&
        answers.version === "3.x" &&
        answers.language === "TypeScript"
      ) {
        appPath = path.join(__dirname, `../templates/base/src/App.vue3-ts.ejs`);
      } else if (
        answers.framework === "Vue" &&
        answers.version === "3.x" &&
        answers.language === "JavaScript"
      ) {
        appPath = path.join(__dirname, `../templates/base/src/App.vue3.ejs`);
      } else {
        appPath = path.join(__dirname, `../templates/base/src/App.${appExt}.ejs`);
      }
      const appContent = renderTemplate(appPath, {
        framework: answers.framework,
        msg: "Welcome to Home",
        language: answers.language,
        cssPreprocessor: answers.cssPreprocessor,
        styleLang,
        styleExt,
      });
      fs.writeFileSync(path.join(srcDir, `App.${appExt}`), appContent);

      // 新增：为 React 生成独立样式文件 --------------------------
      if (answers.framework === "React" && answers.cssPreprocessor !== "CSS") {
        const styleTemplatePath = path.join(
          __dirname,
          `../templates/styles/react/${styleExt}.ejs`
        );

        const styleContent = fs.readFileSync(styleTemplatePath, "utf-8");
        fs.writeFileSync(path.join(srcDir, `App.${styleExt}`), styleContent);
      }

      // 6. 生成构建配置
      const extensions = [
        answers.language === 'TypeScript' && answers.framework === 'React' && '.tsx',
        answers.language === 'TypeScript' && '.ts',
        '.js',
        answers.framework === 'React' && '.jsx',
        answers.framework === 'Vue' && '.vue',
      ].filter(Boolean)
      if(answers.cssPreprocessor !== 'Css'){
        extensions.push(`.${styleExt}`)
      }
      if (answers.builder === "Webpack") {
        ['common', 'dev', 'prod'].forEach(env => {
          const configContent = renderTemplate(
            path.join(__dirname, `../templates/configs/webpack/${env}.js.ejs`),
            {
              framework: answers.framework,
              language: answers.language,
              cssPreprocessor: answers.cssPreprocessor,
              loaderName: {
                'Sass/SCSS': 'sass-loader',
                'Less': 'less-loader',
                'Stylus': 'stylus-loader'
              }[answers.cssPreprocessor],
              styleExt,
              ext: mainExt,
              extensions: extensions,
            }
          );

          fs.writeFileSync(
            path.join(targetPath, `webpack.${env}.js`),
            configContent
          );
        });
      } else {
        const configContent = renderTemplate(
          path.join(
            __dirname,
            `../templates/configs/${answers.builder.toLowerCase()}/vite.config.js.ejs`
          ),
          {
            framework: answers.framework,
            language: answers.language,
            ext: answers.language === "TypeScript" ? "ts" : "js",
            cssPreprocessor: answers.cssPreprocessor,
            styleLang,
            styleExt,
            loaderName: {
              'Sass/SCSS': 'sass-loader',
              'Less': 'less-loader',
              'Stylus': 'stylus-loader'
            }[answers.cssPreprocessor],
          }
        );
        fs.writeFileSync(
          path.join(
            targetPath,
            `vite.config.${configExt}`
          ),
          configContent
        );
      }

      // 生成postcss配置文件
      const postcssContent = renderTemplate(
        path.join(
          __dirname,
          `../templates/configs/postcss/postcss.config.${answers.builder.toLowerCase()}.js`
        ),
      );
      fs.writeFileSync(
        path.join(
          targetPath,
          `postcss.config.js`
        ),
        postcssContent
      );

      // 生成layout文件
      if (answers.framework === "Vue" && answers.version === "3.x" && answers.uiFramework === 'Element Plus') {
        const layoutContent = renderTemplate(
          path.join(__dirname, `../templates/ui-layouts/element-plus-layout.vue.ejs`),
          {
            ...answers,
            styleLang,
            styleExt,
            projectName,
          }
        );
        const loginContent = renderTemplate(
          path.join(__dirname, `../templates/views/vue3-emelent-plus-Login.vue`),
          {}
        );
        const homeContent = renderTemplate(
          path.join(__dirname, `../templates/views/vue3-emelent-plus-Home.vue`),
          {}
        );
        const layoutDir = path.join(srcDir, "layouts");
        const viewsDir = path.join(srcDir, "views");
        // 确保目录存在
        if (!fs.existsSync(layoutDir)) {
          fs.mkdirSync(layoutDir, { recursive: true });
        }
        if (!fs.existsSync(viewsDir)) {
          try {
            fs.mkdirSync(viewsDir, { recursive: true });
          } catch (err) {
            console.log(err, 'err')
            if (err.code !== 'EEXIST') {
              throw err;
            }
          }
        }
        fs.writeFileSync(path.join(layoutDir, `MainLayout.vue`), layoutContent);
        fs.writeFileSync(path.join(viewsDir, `Login.vue`), loginContent);
        fs.writeFileSync(path.join(viewsDir, `Home.vue`), homeContent);
      }

      // 7. 生成语言配置
      if (answers.language === "TypeScript") {
        const tsConfig = renderTemplate(
          path.join(__dirname, "../templates/specials/tsconfig.json.ejs"),
          { framework: answers.framework }
        );
        fs.writeFileSync(path.join(targetPath, "tsconfig.json"), tsConfig);
      }

      // 生成模板渲染文件index.html
      const renderTemplateFile = (_targetPath, templatePath, data) => {
        const template = fs.readFileSync(
          path.join(__dirname, templatePath),
          "utf-8"
        );
        const content = ejs.render(template, data);
        fs.writeFileSync(
          path.join(_targetPath, path.basename(templatePath)),
          content
        );
        // 如果是Vite，删除public/index.html
        if (answers.builder === "Vite") {
          const deleteFilePath = path.join(
            path.join(_targetPath, "public"),
            path.basename(templatePath)
          );
          fs.unlink(deleteFilePath, (err) => {
            if (err) {
              console.error("删除文件时发生错误：", err);
              return;
            }
          });
        }
      };
      renderTemplateFile(
        answers.builder === "Vite"
          ? targetPath
          : path.join(targetPath, "public"),
        "../templates/base/public/index.html",
        {
          projectName,
          framework: answers.framework,
          builder: answers.builder,
          ext: answers.language === "TypeScript" ? "ts" : "js",
        }
      );

      // 直接复制的文件
      const commonDir = path.join(srcDir, "common");
      fs.mkdirSync(commonDir);
      fs.copySync(
        path.join(__dirname, `../templates/common/constants.${configExt}`),
        path.join(commonDir, `constants.${configExt}`)
      );

      // 生成全局变量文件
      if (answers.cssPreprocessor !== 'CSS') {
        const stylesDir = path.join(srcDir, 'styles');
        fs.ensureDirSync(stylesDir);

        // 根据选择的预处理器复制对应变量模板
        const varTemplateMap = {
          'Sass/SCSS': '_variables.scss.ejs',
          'Less': '_variables.less.ejs',
          'Stylus': '_variables.styl.ejs'
        };

        fs.copySync(
          path.join(__dirname, `../templates/styles/${varTemplateMap[answers.cssPreprocessor]}`),
          path.join(stylesDir, `_variables.${styleExt}`)
        );
      }

      if (answers.cssPreprocessor === 'Sass/SCSS') {
        const stylesDir = path.join(srcDir, 'styles');
        fs.ensureDirSync(stylesDir);

        // 生成主入口文件
        fs.writeFileSync(
          path.join(stylesDir, '_index.scss'),
          renderTemplate(path.join(__dirname, '../templates/styles/_index.scss.ejs'))
        );

        // 生成变量文件
        // fs.writeFileSync(
        //   path.join(stylesDir, '_variables.scss'),
        //   `$primary-color: #42b983;\n$text-color: #2c3e50;`
        // );
      }

      // 集成路由
      if (answers.needRouter) {
        // 创建路由目录
        const routesDir = path.join(srcDir, "routes");
        fs.mkdirSync(routesDir);

        // 生成路由配置文件
        let routerTemplate;
        if (answers.framework === "Vue") {
          const routerExt = answers.language === "TypeScript" ? "ts" : "js";
          routerTemplate = path.join(
            __dirname,
            `../templates/routes/vue${answers.version === "3.x" ? "3" : "2"
            }-router.${routerExt}.ejs`
          );
        } else {
          const routerExt = answers.language === "TypeScript" ? "tsx" : "jsx";
          routerTemplate = path.join(
            __dirname,
            `../templates/routes/react-router.${routerExt}.ejs`
          );
        }

        const routerContent = renderTemplate(routerTemplate, {
          styleExt: answers.cssPreprocessor !== "CSS" ? styleExt : "css",
        });

        fs.writeFileSync(
          path.join(
            routesDir,
            // path.basename(routerTemplate).replace(".ejs", "")
            `router.${answers.language === "TypeScript" ? "ts" : "js"}`
          ),
          routerContent
        );

        // 创建示例页面
        const pagesDir = path.join(srcDir, 'views');
        if (!fs.existsSync(pagesDir)) {
          fs.mkdirSync(pagesDir);
        }

        // 在生成路由配置之后添加：
        ["Home", "About"].forEach((page) => {
          const templatePath = path.join(
            __dirname,
            `../templates/components/${answers.framework === "Vue"
              ? `vue${answers.version === "3.x" ? "" : "2"}-page.${appExt}.ejs`
              : "react-page.tsx.ejs"
            }`
          );

          const pageContent = renderTemplate(templatePath, {
            name: page,
            styleExt,
            styleLang,
            needRouter: answers.needRouter,
            language: answers.language,
            cssPreprocessor: answers.cssPreprocessor,
          });

          fs.writeFileSync(path.join(pagesDir, `${page}.${appExt}`), pageContent);

          // 生成对应的样式文件（仅React）
          if (
            answers.framework === "React" &&
            answers.cssPreprocessor !== "CSS"
          ) {
            const styleContent = renderTemplate(
              path.join(
                __dirname,
                `../templates/styles/react/${styleExt}.ejs`
              ),
              { name: page }
            );
            fs.writeFileSync(
              path.join(pagesDir, `${page}.${styleExt}`),
              styleContent
            );
          }
        });
      }

      // 在生成路由配置之后添加store生成逻辑
      if (answers.needStore && answers.framework === "Vue") {
        const storeDir = path.join(srcDir, "store");
        fs.mkdirSync(storeDir);

        const storeTemplate = answers.version === "3.x"
          ? `pinia-store.${answers.language === "TypeScript" ? 'ts' : 'js'}.ejs`
          : `vuex-store.${answers.language === "TypeScript" ? 'ts' : 'js'}.ejs`;

        const storeContent = renderTemplate(
          path.join(__dirname, `../templates/store/${storeTemplate}`),
          {
            language: answers.language,
            needRouter: answers.needRouter,
            version: answers.version,
            needStore: answers.needStore,
          }
        );

        fs.writeFileSync(
          path.join(storeDir, `index.${answers.language === "TypeScript" ? 'ts' : 'js'}`),
          storeContent
        );
      }

      // 8. 生成package.json
      const pkg = {
        name: projectName,
        version: "1.0.0",
        type: "module",
        license: "ISC",
        scripts: {
          dev:
            answers.builder === "Vite"
              ? "vite"
              : "webpack serve --config webpack.dev.js",
          build:
            answers.builder === "Vite"
              ? "vite build"
              : "webpack build --config webpack.prod.js",
        },
        dependencies: getDependencies(answers),
        devDependencies: getDevDependencies(answers),
      };
      // 在生成package.json逻辑中添加
      if (answers.needLint) {
        pkg.scripts = {
          ...pkg.scripts,
          "lint:js": "eslint --fix --ext .js,.jsx,.ts,.tsx,.vue src",
          "lint:style": 'stylelint --fix "src/**/*.{css,scss,vue}"',
          format: "prettier --write .",
          // prepare: "husky install",
        };

        pkg["lint-staged"] = {
          "*.{js,jsx,ts,tsx,vue}": ["eslint --fix", "prettier --write"],
          "*.{css,scss}": ["stylelint --fix", "prettier --write"],
        };
      }

      // 复制test框架目录
      // fs.copySync(
      //   path.join(__dirname, "../templates/test/cypress"),
      //   path.join(targetPath, "cypress")
      // );

      if (answers.testFramework === "Cypress") {
        // 创建cypress目录结构
        const cypressDir = path.join(targetPath, "cypress");
        const cypressSubDirs = ["e2e", "fixtures", "support"];
        cypressSubDirs.forEach(dir => {
          fs.mkdirSync(path.join(cypressDir, dir), { recursive: true });
        });

        // 生成类型声明文件
        const typeDefsContent = `// 完整类型声明见步骤1的内容
        ${fs.readFileSync(path.join(__dirname, '../templates/test/cypress/support/index.d.ts'), 'utf-8')}`

        fs.writeFileSync(
          path.join(cypressDir, 'support/index.d.ts'),
          ejs.render(typeDefsContent, { uiFramework: answers.uiFramework })
        )

        // 生成核心配置文件
        const configFixtureContent = ejs.render(
          fs.readFileSync(
            path.join(__dirname, '../templates/test/cypress/fixtures/config.json.ejs'),
            'utf-8'
          ),
          {
            projectName,
            devPort: answers.builder === 'Vite' ? 5173 : 3000
          }
        )

        fs.writeFileSync(
          path.join(cypressDir, 'fixtures/config.json'),
          configFixtureContent
        )

        // 确保生成正确的文件扩展名
        const commandFileExt = answers.language === 'TypeScript' ? 'ts' : 'js'

        // ========== 生成 support 文件 ==========
        // 使用模板生成 commands.js
        const commandsTemplate = fs.readFileSync(
          path.join(__dirname, '../templates/test/cypress/support/commands.js.ejs'),
          'utf-8'
        )
        const commandsContent = ejs.render(commandsTemplate, {
          projectName,
          uiFramework: answers.uiFramework,
          framework: answers.framework,
          cypressVersion: '13.6.0',
        })
        fs.writeFileSync(
          path.join(cypressDir, `support/commands.${commandFileExt}`),
          commandsContent
        )

        // 生成 e2e.js
        const e2eTemplate = fs.readFileSync(
          path.join(__dirname, '../templates/test/cypress/support/e2e.js.ejs'),
          'utf-8'
        )
        fs.writeFileSync(
          path.join(cypressDir, 'support/e2e.js'),
          ejs.render(e2eTemplate)
        )

        // tsconfig.json
        if (answers.language === 'TypeScript') {
          const tsconfigContent = fs.readFileSync(
            path.join(__dirname, '../templates/test/cypress/tsconfig.json'),
            'utf-8'
          )
          fs.writeFileSync(
            path.join(cypressDir, 'tsconfig.json'),
            tsconfigContent
          )
        }

        // ========== 生成 fixtures 文件 ==========
        const exampleFixtureTemplate = fs.readFileSync(
          path.join(__dirname, '../templates/test/cypress/fixtures/example.json.ejs'),
          'utf-8'
        )
        const exampleFixtureContent = ejs.render(exampleFixtureTemplate, {
          projectName
        })
        fs.writeFileSync(
          path.join(cypressDir, 'fixtures/example.json'),
          exampleFixtureContent
        )

        // 生成配置文件
        const cypressConfig = renderTemplate(
          path.join(__dirname, "../templates/test/cypress.config.js.ejs"),
          { builder: answers.builder }
        );
        fs.writeFileSync(path.join(targetPath, "cypress.config.js"), cypressConfig);

        // 生成示例测试用例
        const testCaseContent = renderTemplate(
          path.join(__dirname, "../templates/test/cypress/e2e/homepage.cy.js.ejs"),
          { projectName, framework: answers.framework }
        );
        fs.writeFileSync(
          path.join(cypressDir, "e2e/homepage.cy.js"),
          testCaseContent
        );

        pkg.scripts = {
          ...pkg.scripts,
          "preview": "vite preview",
          // prepare: pkg.scripts.prepare ? "cypress install" : pkg.scripts.prepare + " ; cypress install",
          "test:e2e": "npm run build && start-server-and-test preview http://localhost:4173 'cypress run --e2e'",
          "test:e2e:dev": "start-server-and-test 'vite dev --port 5173' http://localhost:5173 'cypress open --e2e'",
          "test:e2e:ci": "npm run build && start-server-and-test preview http://localhost:4173 'cypress run --e2e --headless'"
        };

        // GitHub Actions 集成
        fs.copySync(
          path.join(__dirname, "../templates/test/.github"),
          path.join(targetPath, ".github")
        );
        // 添加 CI 所需的环境变量
        const envContent = `CYPRESS_RECORD_KEY=\nBASE_URL=http://localhost:5173`;
        fs.writeFileSync(path.join(targetPath, ".env.ci"), envContent);

        execSync('npx cypress install', { stdio: 'inherit' });
      }

      // 在生成语言配置部分添加
      if (answers.language === "TypeScript" && answers.needStore) {
        if (answers.framework === "Vue") {
          if (answers.version === "3.x") {
            fs.writeFileSync(
              path.join(targetPath, "src/shims-pinia.d.ts"),
              `import { Pinia } from 'pinia';
              declare module 'pinia' {
                export interface PiniaCustomProperties {
                  // 添加你的自定义属性类型
                }
              }`
            );
          } else {
            fs.writeFileSync(
              path.join(targetPath, "src/shims-vuex.d.ts"),
              `import { Store } from 'vuex';
              declare module '@vue/runtime-core' {
                interface ComponentCustomProperties {
                  $store: Store<any>;
                }
              }`
            );
          }
        }
      }

      // 集成代码规范
      if (answers.needLint) {
        generateLintConfig(targetPath, answers);
        addLintDependencies(pkg, answers);
      }
      fs.writeFileSync(
        path.join(targetPath, "package.json"),
        JSON.stringify(pkg, null, 2)
      );

      // 9. 安装依赖
      // spinner.text = "正在安装依赖...";
      // execSync("yarn install", { cwd: targetPath, stdio: "inherit" });

      // 在脚手架代码中添加构建工具警告抑制
      if (answers.cssPreprocessor === 'Sass/SCSS') {
        execSync('echo "SASS_WARN_DEPRECATION=0" >> .env', {
          cwd: targetPath,
          stdio: 'ignore'
        });
      }

      // 在项目生成完成后执行
      if (answers.needLint) {
        // 初始化 Git 仓库（Husky 的前置条件）
        execSync("git init", {
          cwd: targetPath,
          stdio: "inherit",
          shell: process.platform === "win32" ? "cmd.exe" : "/bin/bash",
        });

        // 生成 .gitignore 文件
        generateGitIgnore(targetPath, answers);

        // 新版 Husky 初始化流程
        execSync("npx husky init", {
          cwd: targetPath,
          stdio: "inherit",
          shell: true,
        });

        // 直接写入 pre-commit 钩子（兼容所有平台）
        const hookContent =
          '#!/usr/bin/env sh\n. "$(dirname -- "$0")/_/husky.sh"\n\nnpx lint-staged';
        const preCommitPath = path.join(targetPath, ".husky/pre-commit");
        fs.writeFileSync(preCommitPath, hookContent);
        fs.chmodSync(preCommitPath, 0o755); // 设置可执行权限

        // 确保 package.json 配置正确
        const pkgPath = path.join(targetPath, "package.json");
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        pkg.scripts.prepare = "husky";
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      }

      spinner.succeed(`
        项目创建成功！运行以下命令：
        ${chalk.cyan(`cd ${projectName}`)}
        ${chalk.cyan("yarn install")}
        ${chalk.cyan("yarn dev")}
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
  if (answers.framework === "React") {
    deps.react = answers.version === "18.x" ? "^18.2.0" : "^17.0.2";
    deps["react-dom"] = deps.react;
  } else {
    deps.vue = answers.version === "3.x" ? "^3.3.4" : "^2.7.14";
  }
  if (answers.language === "TypeScript") {
    deps.typescript = "^5.0.4";
    if (answers.framework === "React") deps["@types/react"] = "^18.2.15";
  }
  // 添加路由依赖
  if (answers.needRouter) {
    if (answers.framework === "Vue") {
      deps["vue-router"] = answers.version === "3.x" ? "^4.2.5" : "^3.6.5";
    } else if (answers.framework === "React") {
      deps["react-router-dom"] = "^6.20.0";
    }
  }
  if (answers.builder === "Webpack") {
    deps["terser-webpack-plugin"] = '^5.3.9',
      deps["mini-css-extract-plugin"] = '^2.7.6',
      deps["css-minimizer-webpack-plugin"] = '^5.0.1'
  }
  // 添加状态管理依赖
  if (answers.needStore) {
    if (answers.framework === "Vue") {
      if (answers.version === "3.x") {
        deps["pinia"] = "^2.1.7";
      } else {
        deps["vuex"] = "^3.6.2";
      }
    }
  }
  return deps;
}

function getDevDependencies(answers) {
  const devDeps = {};
  if (answers.language === 'TypeScript') {
    devDeps["@types/node"] = "^22.15.14";
  }
  if (answers.testFramework === 'Cypress') {
    devDeps["cypress"] = "^14.2.1";
    devDeps["start-server-and-test"] = "^2.0.3";
    if (answers.builder === 'Webpack') {
      devDeps["@cypress/webpack-preprocessor"] = "^5.15.0";
      devDeps["@cypress/webpack-dev-server"] = "^3.2.0";
    } else {
      devDeps["postcss-preset-env"] = "^10.1.6";
    }
  }
  devDeps["modern-normalize"] = "^3.0.1";
  devDeps["postcss-preset-env"] = "^10.1.6";
  devDeps["postcss-load-config"] = "^6.0.1";
  devDeps["cssnano"] = "^7.0.6";
  if (answers.builder === "Vite") {
    devDeps.vite = "^4.4.5";
    if (answers.framework === "React")
      devDeps["@vitejs/plugin-react"] = "^4.0.3";
    if (answers.framework === "Vue") {
      devDeps["@vitejs/plugin-vue"] =
        answers.version === "3.x" ? "^4.2.3" : "^2.3.4";
    }
  } else {
    devDeps.webpack = "5.89.0";
    devDeps['css-loader'] = '^6.8.0',
      devDeps['style-loader'] = '^3.3.1',
      devDeps['postcss-loader'] = '^8.1.1',
      devDeps['autoprefixer'] = '^10.4.21',
      devDeps['webpack-merge'] = '^5.9.0',
      devDeps["webpack-cli"] = "4.10.0";
    devDeps["webpack-dev-server"] = "4.15.1";
    devDeps["html-webpack-plugin"] = "^5.6.3";
    devDeps["babel-core"] = "^6.26.3";
    devDeps["babel-loader"] = "^8.3.0";
    devDeps["@babel/core"] = "^7.20.0";
    devDeps["@babel/preset-env"] = "^7.20.0";
    if (answers.framework === "React") {
      devDeps["@babel/preset-react"] = "^7.18.6";
      devDeps["react-refresh"] = "0.14.0";
      devDeps["@pmmmwh/react-refresh-webpack-plugin"] = "0.5.11";
      devDeps["@babel/plugin-transform-runtime"] = "^7.26.10";
    }
    if (answers.framework === "Vue") {
      devDeps["vue-loader"] =
        answers.version === "3.x" ? "^17.2.2" : "^15.11.1";
      if (answers.version === "2.x")
        devDeps["vue-template-compiler"] = "^2.7.14";
      if (answers.language === "TypeScript") {
        devDeps["@babel/plugin-transform-typescript"] = "^7.27.0";
      }
      devDeps["@vue/babel-preset-jsx"] = "^1.4.0";
    }
    if (answers.language === "TypeScript") {
      devDeps["@babel/preset-typescript"] = "^7.27.0";
    }
  }
  if (answers.uiFramework === 'Ant Design') {
    devDeps["antd"] = "^5.24.9";
  }
  if (answers.uiFramework === 'Ant Design Vue' && answers.version === '3.x') {
    devDeps["ant-design-vue"] = "4.x";
  }
  if (answers.uiFramework === 'Ant Design Vue' && answers.version === '2.x') {
    devDeps["ant-design-vue"] = "^1.7.8";
  }
  if (answers.uiFramework === 'Element Plus') {
    devDeps["element-plus"] = "^2.9.9";
  }
  if (answers.uiFramework === 'Element UI') {
    devDeps["element-ui"] = "^2.15.12";
  }
  // CSS 预处理器依赖
  const baseDeps = {
    'Sass/SCSS': {
      'sass': '^1.71.0',
      ...(answers.builder !== 'Vite' && { 'sass-loader': '^13.3.2' })
    },
    'Less': {
      'less': '^4.2.0',
      ...(answers.builder !== 'Vite' && { 'less-loader': '^11.1.3' })
    },
    'Stylus': {
      'stylus': '^0.59.0',
      ...(answers.builder !== 'Vite' && { 'stylus-loader': '^7.1.0' })
    }
  };

  console.log(JSON.stringify(baseDeps), 'baseDeps222')
  console.log(answers.cssPreprocessor, 'answers.cssPreprocessor111')

  // 添加预处理器依赖
  if (answers.cssPreprocessor !== "CSS") {
    Object.assign(devDeps, baseDeps[answers.cssPreprocessor]);
  }

  return devDeps;
}

// 配置代码规范集成（eslint、stylelint、prettier）
function generateLintConfig(targetPath, answers) {
  const { framework, language, builder } = answers;

  // ESLint 配置
  const eslintConfig = {
    extends: [
      "eslint:recommended",
      framework === "Vue"
        ? "plugin:vue/vue3-recommended"
        : "plugin:react/recommended",
      "prettier",
    ],
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      ...(language === "TypeScript" && {
        parser: "@typescript-eslint/parser",
      }),
      ...(framework === "Vue" && {
        parser: "vue-eslint-parser",
      }),
    },
    plugins: [
      ...(framework === "Vue" ? ["vue"] : ["react"]),
      ...(language === "TypeScript" ? ["@typescript-eslint"] : []),
    ],
    rules: {
      "no-console": "warn",
      "prefer-const": "error",
    },
    env: {
      browser: true,
      es2021: true,
    },
  };

  fs.writeFileSync(
    path.join(targetPath, ".eslintrc.js"),
    `export default ${JSON.stringify(eslintConfig, null, 2)}`
  );

  // Prettier 配置
  const prettierConfig = {
    semi: false,
    singleQuote: true,
    trailingComma: "none",
    printWidth: 100,
    endOfLine: "auto",
  };
  fs.writeFileSync(
    path.join(targetPath, ".prettierrc"),
    JSON.stringify(prettierConfig, null, 2)
  );

  // Stylelint 配置
  const stylelintConfig = {
    extends: [
      "stylelint-config-standard",
      "stylelint-config-prettier",
      answers.cssPreprocessor === "Sass/SCSS" &&
      "stylelint-config-standard-scss",
      answers.cssPreprocessor === "Less" && "stylelint-config-recommended-less",
      answers.cssPreprocessor === "Stylus" && "stylelint-config-stylus",
    ].filter(Boolean),
    rules: {
      "selector-class-pattern": null,
      "no-descending-specificity": null,
    },
  };
  fs.writeFileSync(
    path.join(targetPath, ".stylelintrc.js"),
    `export default ${JSON.stringify(stylelintConfig, null, 2)}`
  );
}

function addLintDependencies(pkg, answers) {
  pkg.devDependencies = {
    ...pkg.devDependencies,
    // ESLint 全家桶
    eslint: "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-import": "^2.29.1",
    "eslint-plugin-prettier": "^5.1.3",
    // Vue 专属
    ...(answers.framework === "Vue" && {
      "eslint-plugin-vue": "^9.20.0",
      "vue-eslint-parser": "^9.4.2",
    }),
    // React 专属
    ...(answers.framework === "React" && {
      "eslint-plugin-react": "^7.33.2",
      "eslint-plugin-react-hooks": "^4.6.0",
    }),
    // TypeScript 支持
    ...(answers.language === "TypeScript" && {
      "@typescript-eslint/eslint-plugin": "^6.19.1",
      "@typescript-eslint/parser": "^6.19.1",
    }),
    // Prettier
    prettier: "^3.2.5",
    // Stylelint
    stylelint: "^14.16.1",
    "stylelint-config-standard": "^34.0.0",
    "stylelint-config-prettier": "^9.0.5",
    // Husky
    husky: "^9.0.11",
    "lint-staged": "^15.2.2",
  };
}

// 新增 .gitignore 生成函数
function generateGitIgnore(targetPath, answers) {
  const ignoreRules = new Set([
    "# 通用规则",
    "node_modules",
    "dist",
    "build",
    ".env",
    ".env.local",
    ".cache",
    ".DS_Store",
    "coverage",
    "*.log",
    "npm-debug.log*",
    "yarn-debug.log*",
    "yarn-error.log*",
    ".idea",
    ".vscode",
    ".temp",
    ".husky/_", // 排除 Husky 内部目录

    "# 构建工具相关",
    ...(answers.builder === "Vite"
      ? [".vite", "*.local"]
      : ["webpack-assets.json"]),

    "# 框架相关",
    ...(answers.framework === "React"
      ? [".eslintcache"]
      : [
        "*.vue.html", // Vue 特殊文件
      ]),

    "# 代码规范工具",
    ...(answers.needLint
      ? [
        ".eslintcache",
        ".stylelintcache",
        "!/.eslintrc.js", // 保留配置文件
        "!/.prettierrc",
        "!/.stylelintrc.js",
      ]
      : []),

    "# TypeScript 生成文件",
    ...(answers.language === "TypeScript"
      ? ["*.tsbuildinfo", "dist-types"]
      : []),
    ...(answers.testFramework === "Cypress"
      ? ["# Cypress",
        "cypress/videos/",
        "cypress/screenshots/",
        "cypress/downloads/",
        "# Cypress 动态配置",
        "cypress/fixtures/config.local.json"]
      : []),
  ]);

  fs.writeFileSync(
    path.join(targetPath, ".gitignore"),
    Array.from(ignoreRules).join("\n")
  );
}
