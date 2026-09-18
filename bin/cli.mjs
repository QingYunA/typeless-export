#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
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
import {
  detectIsEnglish,
} from '../src/i18n.mjs';

const rawArgs = process.argv.slice(2);
const isEn = detectIsEnglish(rawArgs, process.env);
process.env.TLE_LANG = isEn ? 'en' : 'zh';

const args = [];
for (let i = 0; i < rawArgs.length; i++) {
  const a = rawArgs[i];
  if (a === '--en' || a === '--lang=en' || a === '--zh' || a === '--lang=zh') {
    continue;
  }
  if (a === '--lang' && rawArgs[i + 1]) {
    i++;
    continue;
  }
  args.push(a);
}
const command = args[0] || 'help';

function showHelp() {
  if (isEn) {
    console.log(`
Typeless Export (tle) - Vocabulary Export & Migration Tool

Usage:
  tle <command> [options]
  npx typeless-export <command>

Commands:
  export [dir]       Export local Typeless vocabulary (default: ~)
  migrate            Export from Typeless and import directly into OpenLess
  sync               Sync bundled 240+ programmer & AI hotwords to OpenLess
  import <file>      Import custom wordlist file to OpenLess
  help, -h           Show help

Options:
  --en, --lang=en    Display output in English
  --zh, --lang=zh    Display output in Chinese
  --preset <name>    Specify scene preset name (for import)

Examples:
  npx typeless-export export
  npx typeless-export export ~/Downloads
  npx typeless-export migrate
  npx typeless-export sync
`);
  } else {
    console.log(`
Typeless Export (tle) - 词库导出与迁移工具

用法:
  tle <command> [options]
  npx typeless-export <command>

命令:
  export [dir]       导出本地 Typeless 词库 (默认保存至 ~)
  migrate            一键从 Typeless 导出并导入 OpenLess (后续支持更多语音工具)
  sync               将自带的 240+ 程序员与 AI 词汇导入 OpenLess
  import <file>      导入自定义词表到 OpenLess
  help, -h           查看帮助

选项:
  --zh, --lang=zh    以中文输出
  --en, --lang=en    以英文输出
  --preset <name>    指定预设分类名称 (用于 import)

示例:
  npx typeless-export export
  npx typeless-export export ~/Downloads
  npx typeless-export migrate
  npx typeless-export sync
`);
  }
}

async function handleExport() {
  const customDir = args[1];
  const homeDir = process.env.HOME || process.env.USERPROFILE || os.homedir();
  const targetDir = customDir
    ? path.resolve(process.cwd(), customDir.replace(/^~(?=$|\/)/, homeDir))
    : homeDir;

  console.log(isEn ? 'Reading local Typeless credentials...' : '正在读取本地 Typeless 登录凭据...');
  try {
    const result = await exportTypelessToFile(targetDir);
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
      console.log(`- OpenLess Expansion Pack (vocab-presets.json): ${action} "${res.presetName}" (${res.presetWordsCount} terms)`);
      console.log(`- Your personal dictionary is untouched. You can toggle this pack on/off in OpenLess settings.`);
      console.log(`\nNote: Please restart OpenLess to see the new expansion pack.`);
    } else {
      console.log(`导入完成:`);
      console.log(`- OpenLess 拓展集 (vocab-presets.json): 已${res.presetAction}「${res.presetName}」(${res.presetWordsCount} 词)`);
      console.log(`- 个人活跃词库保持独立未受影响，你可以在 OpenLess 偏好设置中自由勾选是否启用。`);
      console.log(`\n提示: 请退出并重新打开 OpenLess 查看新增拓展集。`);
    }
  } catch (err) {
    console.error(isEn ? `Import failed: ${err.message}` : `导入失败: ${err.message}`);
    process.exit(1);
  }
}

async function handleSync() {
  try {
    const programmerWords = loadVocabFile('programmer.txt');
    console.log(isEn ? `Loaded ${programmerWords.length} technical hotwords` : `已载入 ${programmerWords.length} 个技术词汇`);

    const presetName = isEn ? 'Programmer & AI Hotwords' : '程序员常用热词';
    const res = importToOpenLess(programmerWords, {
      presetName,
      presetId: 'programmer_hotwords',
    });

    if (isEn) {
      const action = res.presetAction === '新建' ? 'Created' : 'Updated';
      console.log(`Sync completed:`);
      console.log(`- OpenLess Preset: ${action} "${res.presetName}" (${res.presetWordsCount} terms)`);
      console.log(`- Note: Preset is not auto-enabled. You can toggle it on/off in OpenLess settings.`);
      console.log(`\nTip: Please restart OpenLess to see the updated preset.`);
    } else {
      console.log(`同步完成:`);
      console.log(`- OpenLess 拓展预设: 已${res.presetAction}「${res.presetName}」(${res.presetWordsCount} 词)`);
      console.log(`- 说明: 该预设未默认启用，你可以在 OpenLess 偏好设置中自由勾选是否启用。`);
      console.log(`\n提示: 请退出并重新打开 OpenLess 查看新增预设。`);
    }
  } catch (err) {
    console.error(isEn ? `Sync failed: ${err.message}` : `同步失败: ${err.message}`);
    process.exit(1);
  }
}

async function handleMigrate() {
  console.log(isEn ? 'Starting migration from Typeless to OpenLess...' : '开始导出并迁移 Typeless 词库到 OpenLess...');

  let typelessWords = [];
  const homeDir = process.env.HOME || process.env.USERPROFILE || os.homedir();
  try {
    const result = await exportTypelessToFile(homeDir);
    typelessWords = result.words.map(w => w.term || w.word).filter(Boolean);
    if (isEn) {
      console.log(`Found Typeless account: ${result.email}`);
      console.log(`Exported ${result.words.length} terms to home directory (~):`);
      console.log(`- Text: ${result.txtPath}`);
      console.log(`- CSV:  ${result.csvPath}`);
      console.log(`- JSON: ${result.jsonPath}`);
    } else {
      console.log(`已获取凭据: ${result.email}`);
      console.log(`已导出 ${result.words.length} 个词条至家目录 (~):`);
      console.log(`- 文本: ${result.txtPath}`);
      console.log(`- 表格: ${result.csvPath}`);
      console.log(`- JSON: ${result.jsonPath}`);
    }
  } catch (err) {
    console.error(isEn ? `Typeless export failed: ${err.message}` : `从 Typeless 导出失败: ${err.message}`);
    process.exit(1);
  }

  // 1. 预设 1: Typeless 个人词典
  const typelessPresetName = isEn ? 'Typeless Personal Vocabulary' : 'Typeless 个人词典';
  const res1 = importToOpenLess(typelessWords, {
    presetName: typelessPresetName,
    presetId: 'typeless_personal',
  });

  // 2. 预设 2: 程序员常用热词
  const programmerWords = loadVocabFile('programmer.txt');
  const programmerPresetName = isEn ? 'Programmer & AI Hotwords' : '程序员常用热词';
  const res2 = importToOpenLess(programmerWords, {
    presetName: programmerPresetName,
    presetId: 'programmer_hotwords',
  });

  if (isEn) {
    console.log(`\nMigration completed! Added 2 expansion presets to OpenLess:`);
    console.log(`- Preset 1: "${typelessPresetName}" (${res1.presetWordsCount} terms)`);
    console.log(`- Preset 2: "${programmerPresetName}" (${res2.presetWordsCount} terms)`);
    console.log(`- Note: Neither preset is auto-enabled. You can toggle them on/off in OpenLess settings.`);
    console.log(`\nTip: Please restart OpenLess to see the new presets.`);
  } else {
    console.log(`\n迁移完成！已为 OpenLess 新增 2 个独立拓展预设：`);
    console.log(`- 预设 1:「${typelessPresetName}」(${res1.presetWordsCount} 词)`);
    console.log(`- 预设 2:「${programmerPresetName}」(${res2.presetWordsCount} 词)`);
    console.log(`- 说明: 两个预设均未默认启用，保持独立，你可以在 OpenLess 偏好设置中自由选择是否启用。`);
    console.log(`\n提示: 请退出并重新打开 OpenLess 查看新增预设。`);
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
