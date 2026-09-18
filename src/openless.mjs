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
 * 将词汇列表作为拓展集（Preset）安全导入到本地 OpenLess 的 vocab-presets.json
 * 绝不直接污染用户的个人活跃词库 (dictionary.json)，是否启用完全交由用户在设置中勾选
 */
export function importToOpenLess(words, options = {}) {
  const {
    presetName = 'Typeless 迁移词库',
    presetId = 'typeless_migrated',
    dryRun = false,
  } = options;

  const appDir = getOpenLessDir();
  if (!fs.existsSync(appDir)) {
    throw new Error(
      process.env.TLE_LANG === 'en'
        ? `OpenLess data directory not found (${appDir}). Please download and launch OpenLess at least once.`
        : `未找到 OpenLess 数据目录 (${appDir})，请先下载并运行一次 OpenLess。`
    );
  }

  const presetPath = path.join(appDir, 'vocab-presets.json');

  const validWords = [];
  const seen = new Set();
  for (const raw of words) {
    const word = typeof raw === 'string' ? raw.trim() : (raw.term || raw.phrase || '').trim();
    if (word && !seen.has(word.toLowerCase())) {
      seen.add(word.toLowerCase());
      validWords.push(word);
    }
  }

  // 1. 读取并更新 vocab-presets.json (拓展集面板)
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
  let addedCount = 0;
  if (!targetPreset) {
    targetPreset = {
      id: presetId,
      name: presetName,
      phrases: validWords,
    };
    presetStore.custom.push(targetPreset);
    presetAction = '新建';
    addedCount = validWords.length;
  } else {
    const existingPhrases = new Set((targetPreset.phrases || []).map(p => p.toLowerCase()));
    for (const w of validWords) {
      if (!existingPhrases.has(w.toLowerCase())) {
        targetPreset.phrases.push(w);
        existingPhrases.add(w.toLowerCase());
        addedCount++;
      }
    }
  }

  // 2. 写入磁盘（非 dryRun 模式）
  if (!dryRun) {
    backupFile(presetPath);
    fs.writeFileSync(presetPath, JSON.stringify(presetStore, null, 2), 'utf8');
  }

  return {
    dryRun,
    addedCount,
    presetWordsCount: targetPreset.phrases.length,
    presetName,
    presetAction,
    presetPath,
  };
}
