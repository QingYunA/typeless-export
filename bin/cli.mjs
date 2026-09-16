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

const args = process.argv.slice(2);
const command = args[0] || 'help';

function showHelp() {
  console.log(`
Typeless to OpenLess (t2o) - 词库导出与迁移工具

用法:
  t2o <command> [options]
  npx typeless-to-openless <command>

命令:
  export             导出本地 Typeless 词库 (txt, csv, json)
  import <file>      导入自定义词表到 OpenLess
  sync               将自带的 240+ 程序员与 AI 词汇导入 OpenLess
  migrate            一键从 Typeless 导出并导入 OpenLess
  help, -h           查看帮助

示例:
  npx typeless-to-openless export
  npx typeless-to-openless migrate
  npx typeless-to-openless sync
  npx typeless-to-openless import ./my_words.txt --preset "常用词"
`);
}

async function handleExport() {
  console.log('正在读取本地 Typeless 登录凭据...');
  try {
    const result = await exportTypelessToFile(process.cwd());
    console.log(`已获取凭据: ${result.email}`);
    console.log(`已导出 ${result.words.length} 个词条:`);
    console.log(`- 文本: ${result.txtPath}`);
    console.log(`- 表格: ${result.csvPath}`);
    console.log(`- JSON: ${result.jsonPath}`);
  } catch (err) {
    console.error(`导出失败: ${err.message}`);
    process.exit(1);
  }
}

async function handleImport() {
  const filePath = args[1];
  if (!filePath) {
    console.error('请指定文件路径，例如: t2o import ./words.txt');
    process.exit(1);
  }

  const absPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absPath)) {
    console.error(`未找到文件: ${absPath}`);
    process.exit(1);
  }

  let presetName = '外部导入词库';
  const presetIdx = args.indexOf('--preset');
  if (presetIdx !== -1 && args[presetIdx + 1]) {
    presetName = args[presetIdx + 1];
  }

  const raw = fs.readFileSync(absPath, 'utf8');
  const words = parseWordList(raw);
  console.log(`已读取 ${words.length} 个词条`);

  try {
    const res = importToOpenLess(words, {
      presetName,
      presetId: `imported_${Date.now()}`,
    });
    console.log(`导入完成:`);
    console.log(`- 热词库 (dictionary.json): 新增 ${res.addedToDict} 词，现有 ${res.totalDict} 词`);
    console.log(`- 场景预设 (vocab-presets.json): 已${res.presetAction}「${res.presetName}」(${res.presetWordsCount} 词)`);
    console.log(`\n提示: 请退出并重新打开 OpenLess 使词库生效。`);
  } catch (err) {
    console.error(`导入失败: ${err.message}`);
    process.exit(1);
  }
}

async function handleSync() {
  try {
    const programmerWords = loadVocabFile('programmer.txt');
    console.log(`已载入 ${programmerWords.length} 个技术词汇`);

    const res = importToOpenLess(programmerWords, {
      presetName: '程序员常用词',
      presetId: 'programmer_extended',
    });

    console.log(`同步完成:`);
    console.log(`- 热词库: 新增 ${res.addedToDict} 词，现有 ${res.totalDict} 词`);
    console.log(`- 场景预设: 已${res.presetAction}「${res.presetName}」(${res.presetWordsCount} 词)`);
    console.log(`\n提示: 请退出并重新打开 OpenLess 使词库生效。`);
  } catch (err) {
    console.error(`同步失败: ${err.message}`);
    process.exit(1);
  }
}

async function handleMigrate() {
  console.log('开始迁移 Typeless 词库到 OpenLess...');

  let typelessWords = [];
  try {
    const auth = decryptTypelessAuth();
    console.log(`已识别 Typeless 账号: ${auth.email}`);
    const words = await fetchTypelessDictionary(auth.userId, auth.token);
    typelessWords = words.map(w => w.term || w.word).filter(Boolean);
    console.log(`已拉取 ${typelessWords.length} 个本地词条`);
  } catch (err) {
    console.error(`从 Typeless 获取失败: ${err.message}`);
    process.exit(1);
  }

  const programmerWords = loadVocabFile('programmer.txt');
  const allWords = dedupeWords([...typelessWords, ...programmerWords]);

  try {
    const res = importToOpenLess(allWords, {
      presetName: '全部热词(Typeless+技术词)',
      presetId: 'migrated_full_vocab',
    });

    console.log(`迁移完成:`);
    console.log(`- 热词库: 新增 ${res.addedToDict} 词，现有 ${res.totalDict} 词`);
    console.log(`- 场景预设: 已${res.presetAction}「${res.presetName}」(${res.presetWordsCount} 词)`);
    console.log(`\n提示: 请退出并重新打开 OpenLess 使词库生效。`);
  } catch (err) {
    console.error(`写入 OpenLess 失败: ${err.message}`);
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
  console.error('发生错误:', err.message);
  process.exit(1);
});
