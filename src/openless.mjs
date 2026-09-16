import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

export function getOpenLessDir() {
  const platform = os.platform();
  if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library/Application Support/OpenLess');
  } else if (platform === 'win32') {
    return path.join(process.env.APPDATA || '', 'OpenLess');
  } else {
    return path.join(os.homedir(), '.config/OpenLess');
  }
}

function backupFile(filePath) {
  if (fs.existsSync(filePath)) {
    const bakPath = `${filePath}.bak`;
    fs.copyFileSync(filePath, bakPath);
    return bakPath;
  }
  return null;
}

/**
 * 将词汇列表安全导入到本地 OpenLess 的 dictionary.json 和 vocab-presets.json
 */
export function importToOpenLess(words, options = {}) {
  const {
    presetName = 'Typeless迁移词库',
    presetId = 'typeless_migrated',
    dryRun = false,
  } = options;

  const appDir = getOpenLessDir();
  if (!fs.existsSync(appDir)) {
    throw new Error(`未找到 OpenLess 数据目录 (${appDir})，请先下载并运行一次 OpenLess。`);
  }

  const dictPath = path.join(appDir, 'dictionary.json');
  const presetPath = path.join(appDir, 'vocab-presets.json');

  // 1. 读取并更新 dictionary.json (活跃词典)
  let dictList = [];
  if (fs.existsSync(dictPath)) {
    try {
      dictList = JSON.parse(fs.readFileSync(dictPath, 'utf8'));
    } catch {
      dictList = [];
    }
  }

  const existingMap = new Map();
  for (const item of dictList) {
    if (item && item.phrase) {
      existingMap.set(item.phrase.trim().toLowerCase(), item);
    }
  }

  const nowIso = new Date().toISOString();
  let addedToDict = 0;
  const validWords = [];

  for (const raw of words) {
    const word = typeof raw === 'string' ? raw.trim() : (raw.term || raw.phrase || '').trim();
    if (!word) continue;
    validWords.push(word);

    const key = word.toLowerCase();
    if (!existingMap.has(key)) {
      const newEntry = {
        id: crypto.randomUUID(),
        phrase: word,
        note: null,
        enabled: true,
        hits: 0,
        createdAt: nowIso,
      };
      dictList.push(newEntry);
      existingMap.set(key, newEntry);
      addedToDict++;
    } else {
      const existing = existingMap.get(key);
      if (!existing.enabled) {
        existing.enabled = true;
      }
    }
  }

  // 2. 读取并更新 vocab-presets.json (场景预设面板)
  let presetStore = { custom: [], overrides: [], disabledBuiltinPresetIds: [] };
  if (fs.existsSync(presetPath)) {
    try {
      presetStore = JSON.parse(fs.readFileSync(presetPath, 'utf8'));
      if (!Array.isArray(presetStore.custom)) presetStore.custom = [];
    } catch {
      presetStore = { custom: [], overrides: [], disabledBuiltinPresetIds: [] };
    }
  }

  let targetPreset = presetStore.custom.find(
    p => p.id === presetId || p.name === presetName
  );

  let presetAction = '更新';
  if (!targetPreset) {
    targetPreset = {
      id: presetId,
      name: presetName,
      phrases: validWords,
    };
    presetStore.custom.push(targetPreset);
    presetAction = '新建';
  } else {
    const existingPhrases = new Set(targetPreset.phrases || []);
    for (const w of validWords) {
      if (!existingPhrases.has(w)) {
        targetPreset.phrases.push(w);
      }
    }
  }

  // 3. 写入磁盘（非 dryRun 模式）
  if (!dryRun) {
    backupFile(dictPath);
    backupFile(presetPath);

    fs.writeFileSync(dictPath, JSON.stringify(dictList, null, 2), 'utf8');
    fs.writeFileSync(presetPath, JSON.stringify(presetStore, null, 2), 'utf8');
  }

  return {
    dryRun,
    addedToDict,
    totalDict: dictList.length,
    presetWordsCount: targetPreset.phrases.length,
    presetName,
    presetAction,
    dictPath,
    presetPath,
  };
}
