import fs from "fs-extra";
import path from "node:path";

// 动态生成依赖
export function getDependencies(answers) {
    const deps = {};
    if (answers.framework === "React") {
        deps.react = answers.version === "18.x" ? "^18.2.0" : answers.version === "19.x" ? "^19.1.0" : "^17.0.2";
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

export function getDevDependencies(answers) {
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
        devDeps.vite = "^6.3.5";
        if (answers.framework === "React")
            devDeps["@vitejs/plugin-react"] = "^4.5.0";
        if (answers.framework === "Vue") {
            devDeps["@vitejs/plugin-vue"] =
                answers.version === "3.x" ? "^4.2.3" : "^2.3.4";
            devDeps["vite-plugin-vue-devtools"] = '^7.7.2';
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
    if (answers.uiFramework === 'Ant Design Mobile') {
        devDeps["antd-mobile"] = "^5.39.0";
        devDeps["antd-mobile-icons"] = "^0.3.0";
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
    if (answers.framework === "Vue") {
        if (answers.needJsx) {
            devDeps["@vitejs/plugin-vue-jsx"] = "^4.1.2"
        }
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

    // 添加预处理器依赖
    if (answers.cssPreprocessor !== "CSS") {
        Object.assign(devDeps, baseDeps[answers.cssPreprocessor]);
    }

    return devDeps;
}

// 配置代码规范集成（eslint、stylelint、prettier）
export function generateLintConfig(targetPath, answers) {
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

export function addLintDependencies(pkg, answers) {
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
export function generateGitIgnore(targetPath, answers) {
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
        "pnpm-debug.log*",
        "pnpm-error.log*",
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

export default {
    generateGitIgnore,
    generateLintConfig,
    getDependencies,
    getDevDependencies,
    addLintDependencies,
}
