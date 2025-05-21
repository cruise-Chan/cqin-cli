import inquirer from "inquirer";
import pc from 'picocolors'
import chalk from "chalk";
import fs from "fs-extra";
import path from "node:path";
import { execSync } from "child_process";
import ora from "ora";
import ejs from "ejs";

import { fileURLToPath } from "url";
// ESM环境获取__dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import {
    generateGitIgnore,
    generateLintConfig,
    getDependencies,
    getDevDependencies,
    addLintDependencies,
} from '../utils/templateUtils.js'
export async function initCommand(projectName) {
    console.log(pc.green(`Hello, ${projectName}!!!`));
    let spinner;
    spinner = ora();
    // 创建项目目录
    const targetPath = path.resolve(process.cwd(), projectName);
    if (fs.existsSync(targetPath)) {
        spinner.fail(`目录 ${chalk.red(projectName)} 已存在!`);
        process.exit(1);
    }
    const templatesPath = path.join(__dirname, "../../.templates")

    try {
        // 1. 用户交互提问
        const answers = await inquirer.prompt([
            {
                type: "list",
                name: "framework",
                message: "选择框架:",
                choices: [{
                    name: "React",
                    description: '(用于构建用户界面的声明式 JavaScript 库。)'
                }, {
                    name: "Vue",
                    description: '(渐进式 JavaScript 框架，易学易用。)'
                }],
            },
            {
                type: "list",
                name: "version",
                message: "版本:",
                choices: (prev) =>
                    prev.framework === "Vue" ? ["3.x", "2.x"] : ["18.x", "17.x"],
            },
            {
                type: "list",
                name: "builder",
                message: "构建工具:",
                choices: (prev) =>
                    prev.version === "2.x" ? [{
                        name: "Webpack",
                        description: '(vue2推荐使用webpack构建打包)'
                    }] : ["Vite", "Webpack"],
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
                    prev.framework === 'Vue' &&
                    {
                        name: "JSX",
                        value: "JSX",
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

        answers.needRouter = answers.plugins.includes("needRouter");
        answers.needJsx = answers.plugins.includes("JSX");
        answers.needLint = answers.plugins.includes("needLint");
        answers.needStore = answers.plugins.includes("needStore");
        answers.language = answers.plugins.includes("TypeScript") ? "TypeScript" : "JavaScript";

        spinner.start("正在初始化项目...")

        // 全局变量
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
            path.join(templatesPath, "./base/public"),
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
            path.join(templatesPath, `./base/src/main.${mainExt}.ejs`),
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
            appPath = path.join(templatesPath, `./base/src/App.vue3-ts.ejs`);
        } else if (
            answers.framework === "Vue" &&
            answers.version === "3.x" &&
            answers.language === "JavaScript"
        ) {
            appPath = path.join(templatesPath, `./base/src/App.vue3.ejs`);
        } else {
            appPath = path.join(templatesPath, `./base/src/App.${appExt}.ejs`);
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
                templatesPath,
                `./styles/react/${styleExt}.ejs`
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
        if (answers.cssPreprocessor !== 'Css') {
            extensions.push(`.${styleExt}`)
        }
        if (answers.builder === "Webpack") {
            ['common', 'dev', 'prod'].forEach(env => {
                const configContent = renderTemplate(
                    path.join(templatesPath, `./configs/webpack/${env}.js.ejs`),
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
                    templatesPath,
                    `./configs/${answers.builder.toLowerCase()}/vite.config.js.ejs`
                ),
                {
                    framework: answers.framework,
                    language: answers.language,
                    ext: answers.language === "TypeScript" ? "ts" : "js",
                    cssPreprocessor: answers.cssPreprocessor,
                    styleLang,
                    styleExt,
                    needJsx: answers.needJsx,
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
                templatesPath,
                `./configs/postcss/postcss.config.${answers.builder.toLowerCase()}.js`
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
                path.join(templatesPath, `./ui-layouts/element-plus-layout.vue.ejs`),
                {
                    ...answers,
                    styleLang,
                    styleExt,
                    projectName,
                }
            );
            const loginContent = renderTemplate(
                path.join(templatesPath, `./views/vue3-emelent-plus-Login.vue`),
                {}
            );
            const homeContent = renderTemplate(
                path.join(templatesPath, `./views/vue3-emelent-plus-Home.vue`),
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
                    console.log(pc.red(err))
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
                path.join(templatesPath, "./specials/tsconfig.json.ejs"),
                { framework: answers.framework }
            );
            fs.writeFileSync(path.join(targetPath, "tsconfig.json"), tsConfig);
        }

        // 生成模板渲染文件index.html
        const renderTemplateFile = (_targetPath, templatePath, data) => {
            console.log(templatePath, 123)
            const template = fs.readFileSync(
                path.join(templatePath),
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
                        console.error(pc.red("删除文件时发生错误："), err);
                        return;
                    }
                });
            }
            console.log(234)
        };
        renderTemplateFile(
            answers.builder === "Vite"
                ? targetPath
                : path.join(targetPath, "public"),
            path.join(templatesPath, "./base/public/index.html"),
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
            path.join(templatesPath, `./common/constants.${configExt}`),
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
                path.join(templatesPath, `./styles/${varTemplateMap[answers.cssPreprocessor]}`),
                path.join(stylesDir, `_variables.${styleExt}`)
            );
        }

        if (answers.cssPreprocessor === 'Sass/SCSS') {
            const stylesDir = path.join(srcDir, 'styles');
            fs.ensureDirSync(stylesDir);

            // 生成主入口文件
            fs.writeFileSync(
                path.join(stylesDir, '_index.scss'),
                renderTemplate(path.join(templatesPath, './styles/_index.scss.ejs'))
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
                    templatesPath,
                    `./routes/vue${answers.version === "3.x" ? "3" : "2"
                    }-router.${routerExt}.ejs`
                );
            } else {
                const routerExt = answers.language === "TypeScript" ? "tsx" : "jsx";
                routerTemplate = path.join(
                    templatesPath,
                    `./routes/react-router.${routerExt}.ejs`
                );
            }

            const routerContent = renderTemplate(routerTemplate, {
                styleExt: answers.cssPreprocessor !== "CSS" ? styleExt : "css",
                ...answers,
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
                    templatesPath,
                    `./components/${answers.framework === "Vue"
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
                            templatesPath,
                            `./styles/react/${styleExt}.ejs`
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
                path.join(templatesPath, `./store/${storeTemplate}`),
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
            // scripts: {
                // dev:
                //     answers.builder === "Vite"
                //         ? "vite"
                //         : "webpack serve --config webpack.dev.js",
                // build:
                //     answers.builder === "Vite"
                //         ? "vite build"
                //         : "webpack build --config webpack.prod.js",
            // },
            scripts: {
                start: "cqin start",
                build:  "cqin build",
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
        //   path.join(templatesPath, "./test/cypress"),
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
            ${fs.readFileSync(path.join(templatesPath, './test/cypress/support/index.d.ts'), 'utf-8')}`

            fs.writeFileSync(
                path.join(cypressDir, 'support/index.d.ts'),
                ejs.render(typeDefsContent, { uiFramework: answers.uiFramework })
            )

            // 生成核心配置文件
            const configFixtureContent = ejs.render(
                fs.readFileSync(
                    path.join(templatesPath, './test/cypress/fixtures/config.json.ejs'),
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
                path.join(templatesPath, './test/cypress/support/commands.js.ejs'),
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
                path.join(templatesPath, './test/cypress/support/e2e.js.ejs'),
                'utf-8'
            )
            fs.writeFileSync(
                path.join(cypressDir, 'support/e2e.js'),
                ejs.render(e2eTemplate)
            )

            // tsconfig.json
            if (answers.language === 'TypeScript') {
                const tsconfigContent = fs.readFileSync(
                    path.join(templatesPath, './test/cypress/tsconfig.json'),
                    'utf-8'
                )
                fs.writeFileSync(
                    path.join(cypressDir, 'tsconfig.json'),
                    tsconfigContent
                )
            }

            // ========== 生成 fixtures 文件 ==========
            const exampleFixtureTemplate = fs.readFileSync(
                path.join(templatesPath, './test/cypress/fixtures/example.json.ejs'),
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
                path.join(templatesPath, "./test/cypress.config.js.ejs"),
                { builder: answers.builder }
            );
            fs.writeFileSync(path.join(targetPath, "cypress.config.js"), cypressConfig);

            // 生成示例测试用例
            const testCaseContent = renderTemplate(
                path.join(templatesPath, "./test/cypress/e2e/homepage.cy.js.ejs"),
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
                path.join(templatesPath, "./test/.github"),
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

        const npmrcString = `# 提升所有依赖到 node_modules 根目录（类似 yarn/npm 的行为）
          # shamefully-hoist=true
          
          #  或仅允许某些包提升
          public-hoist-pattern[]=@element-plus/*`
        fs.writeFileSync(
            path.join(targetPath, ".npmrc"),
            npmrcString
        );

        // 9. 安装依赖
        // spinner.text = "正在安装依赖...";
        // execSync("pnpm install", { cwd: targetPath, stdio: "inherit" });

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
            ${chalk.cyan("pnpm install")}
            ${chalk.cyan("pnpm start")}
          `);
    } catch (err) {
        console.log(err)
        spinner.fail(`创建失败: ${chalk.red(err.message)}`);
        process.exit(1);
    }
}