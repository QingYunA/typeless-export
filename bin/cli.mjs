#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {
  exportTypelessToFile,
  decryptTypelessAuth,
  fetchTypelessDictionary,
} from '../src/typeless.mjs';
import {
  importToOpenLess,
} from '../src/openless.mjs';
import {
  loadVocabFile,
  parseWordList,
  dedupeWords,
} from '../src/vocab.mjs';

const rawArgs = process.argv.slice(2);
const isEn = process.env.TLE_LANG === 'en' || rawArgs.includes('--en') || rawArgs.includes('--lang=en');
const args = rawArgs.filter(a => a !== '--en' && a !== '--lang=en');
const command = args[0] || 'help';

function showHelp() {
  if (isEn) {
    console.log(`
Typeless Export (tle) - Vocabulary Export & Migration Tool

Usage:
  tle <command> [options]
  npx typeless-export <command>

Commands:
  export             Export local Typeless vocabulary (txt, csv, json)
  migrate            Export from Typeless and import directly into OpenLess
  sync               Sync bundled 240+ programmer & AI hotwords to OpenLess
  import <file>      Import custom wordlist file to OpenLess
  help, -h           Show help

Options:
  --en, --lang=en    Display output in English
  --preset <name>    Specify scene preset name (for import)

Examples:
  npx typeless-export export
  npx typeless-export migrate
  npx typeless-export sync
  npx typeless-export import ./my_words.txt --preset "Frequent"
`);
  } else {
    console.log(`
Typeless Export (tle) - 词库导出与迁移工具

用法:
  tle <command> [options]
  npx typeless-export <command>

命令:
  export             导出本地 Typeless 词库 (txt, csv, json)
  migrate            一键从 Typeless 导出并导入 OpenLess (后续支持更多语音工具)
  sync               将自带的 240+ 程序员与 AI 词汇导入 OpenLess
  import <file>      导入自定义词表到 OpenLess
  help, -h           查看帮助

选项:
  --en, --lang=en    以英文输出
  --preset <name>    指定预设分类名称 (用于 import)

示例:
  npx typeless-export export
  npx typeless-export migrate
  npx typeless-export sync
  npx typeless-export import ./my_words.txt --preset "常用词"
`);
  }
}

async function handleExport() {
  console.log(isEn ? 'Reading local Typeless credentials...' : '正在读取本地 Typeless 登录凭据...');
  try {
    const result = await exportTypelessToFile(process.cwd());
    if (isEn) {
      console.log(`Found credentials: ${result.email}`);
      console.log(`Exported ${result.words.length} terms:`);
      console.log(`- Text:  ${result.txtPath}`);
      console.log(`- CSV:   ${result.csvPath}`);
      console.log(`- JSON:  ${result.jsonPath}`);
    } else {
      console.log(`已获取凭据: ${result.email}`);
      console.log(`已导出 ${result.words.length} 个词条:`);
      console.log(`- 文本: ${result.txtPath}`);
      console.log(`- 表格: ${result.csvPath}`);
      console.log(`- JSON: ${result.jsonPath}`);
    }
  } catch (err) {
    console.error(isEn ? `Export failed: ${err.message}` : `导出失败: ${err.message}`);
    process.exit(1);
  }
}

async function handleImport() {
  const filePath = args[1];
  if (!filePath) {
    console.error(isEn ? 'Please specify a file path, e.g.: tle import ./words.txt' : '请指定文件路径，例如: tle import ./words.txt');
    process.exit(1);
  }

  const absPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absPath)) {
    console.error(isEn ? `File not found: ${absPath}` : `未找到文件: ${absPath}`);
    process.exit(1);
  }

  let presetName = isEn ? 'Custom Vocabulary' : '外部导入词库';
  const presetIdx = args.indexOf('--preset');
  if (presetIdx !== -1 && args[presetIdx + 1]) {
    presetName = args[presetIdx + 1];
  }

  const raw = fs.readFileSync(absPath, 'utf8');
  const words = parseWordList(raw);
  console.log(isEn ? `Loaded ${words.length} terms from file` : `已读取 ${words.length} 个词条`);

  try {
    const res = importToOpenLess(words, {
      presetName,
      presetId: `imported_${Date.now()}`,
    });
    if (isEn) {
      const action = res.presetAction === '新建' ? 'Created' : 'Updated';
      console.log(`Import completed:`);
      console.log(`- Hotwords (dictionary.json): added ${res.addedToDict}, total ${res.totalDict}`);
      console.log(`- Preset (vocab-presets.json): ${action} "${res.presetName}" (${res.presetWordsCount} terms)`);
      console.log(`\nNote: Please restart OpenLess for new vocabulary to take effect.`);
    } else {
      console.log(`导入完成:`);
      console.log(`- 热词库 (dictionary.json): 新增 ${res.addedToDict} 词，现有 ${res.totalDict} 词`);
      console.log(`- 场景预设 (vocab-presets.json): 已${res.presetAction}「${res.presetName}」(${res.presetWordsCount} 词)`);
      console.log(`\n提示: 请退出并重新打开 OpenLess 使词库生效。`);
    }
  } catch (err) {
    console.error(isEn ? `Import failed: ${err.message}` : `导出失败: ${err.message}`);
    process.exit(1);
  }
}

async function handleSync() {
  try {
    const programmerWords = loadVocabFile('programmer.txt');
    console.log(isEn ? `Loaded ${programmerWords.length} technical hotwords` : `已载入 ${programmerWords.length} 个技术词汇`);

    const presetName = isEn ? 'Programmer Terms' : '程序员常用词';
    const res = importToOpenLess(programmerWords, {
      presetName,
      presetId: 'programmer_extended',
    });

    if (isEn) {
      const action = res.presetAction === '新建' ? 'Created' : 'Updated';
      console.log(`Sync completed:`);
      console.log(`- Hotwords: added ${res.addedToDict}, total ${res.totalDict}`);
      console.log(`- Preset: ${action} "${res.presetName}" (${res.presetWordsCount} terms)`);
      console.log(`\nNote: Please restart OpenLess for new vocabulary to take effect.`);
    } else {
      console.log(`同步完成:`);
      console.log(`- 热词库: 新增 ${res.addedToDict} 词，现有 ${res.totalDict} 词`);
      console.log(`- 场景预设: 已${res.presetAction}「${res.presetName}」(${res.presetWordsCount} 词)`);
      console.log(`\n提示: 请退出并重新打开 OpenLess 使词库生效。`);
    }
  } catch (err) {
    console.error(isEn ? `Sync failed: ${err.message}` : `同步失败: ${err.message}`);
    process.exit(1);
  }
}

async function handleMigrate() {
  console.log(isEn ? 'Starting migration from Typeless to OpenLess...' : '开始迁移 Typeless 词库到 OpenLess...');

  let typelessWords = [];
  try {
    const auth = decryptTypelessAuth();
    console.log(isEn ? `Found Typeless account: ${auth.email}` : `已识别 Typeless 账号: ${auth.email}`);
    const words = await fetchTypelessDictionary(auth.userId, auth.token);
    typelessWords = words.map(w => w.term || w.word).filter(Boolean);
    console.log(isEn ? `Retrieved ${typelessWords.length} terms from Typeless` : `已拉取 ${typelessWords.length} 个本地词条`);
  } catch (err) {
    console.error(isEn ? `Typeless fetch failed: ${err.message}` : `从 Typeless 获取失败: ${err.message}`);
    process.exit(1);
  }

  const programmerWords = loadVocabFile('programmer.txt');
  const allWords = dedupeWords([...typelessWords, ...programmerWords]);

  try {
    const presetName = isEn ? 'All Hotwords (Typeless + Tech)' : '全部热词(Typeless+技术词)';
    const res = importToOpenLess(allWords, {
      presetName,
      presetId: 'migrated_full_vocab',
    });

    if (isEn) {
      const action = res.presetAction === '新建' ? 'Created' : 'Updated';
      console.log(`Migration completed:`);
      console.log(`- Hotwords: added ${res.addedToDict}, total ${res.totalDict}`);
      console.log(`- Preset: ${action} "${res.presetName}" (${res.presetWordsCount} terms)`);
      console.log(`\nNote: Please restart OpenLess for new vocabulary to take effect.`);
    } else {
      console.log(`迁移完成:`);
      console.log(`- 热词库: 新增 ${res.addedToDict} 词，现有 ${res.totalDict} 词`);
      console.log(`- 场景预设: 已${res.presetAction}「${res.presetName}」(${res.presetWordsCount} 词)`);
      console.log(`\n提示: 请退出并重新打开 OpenLess 使词库生效。`);
    }
  } catch (err) {
    console.error(isEn ? `Write to OpenLess failed: ${err.message}` : `写入 OpenLess 失败: ${err.message}`);
    process.exit(1);
  }
}

async function main() {
  switch (command) {
    case 'export':
      await handleExport();
      break;
    case 'import':
      await handleImport();
      break;
    case 'sync':
      await handleSync();
      break;
    case 'migrate':
      await handleMigrate();
      break;
    case 'help':
    case '-h':
    case '--help':
    default:
      showHelp();
      break;
  }
}

main().catch(err => {
  console.error(isEn ? 'Error:' : '发生错误:', err.message);
  process.exit(1);
});
