import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { rm, mkdir, cp } from 'fs/promises';

// 获取当前文件的目录路径（替代 __dirname）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 源模板路径（Monorepo 中的 templates 目录）
const sourceTemplatesDir = join(__dirname, '../../templates');

// 目标路径（cli 包内的临时目录）
const destTemplatesDir = join(__dirname, '../templates');

async function copyTemplates() {
  try {
    // 清空并复制模板
    await rm(destTemplatesDir, { recursive: true, force: true });
    await mkdir(destTemplatesDir, { recursive: true });
    await cp(sourceTemplatesDir, destTemplatesDir, { recursive: true });
    
    console.log('模板已复制到 CLI 包内！');
  } catch (error) {
    console.error('复制模板时出错:', error);
    process.exit(1);
  }
}

// 执行异步函数
copyTemplates();