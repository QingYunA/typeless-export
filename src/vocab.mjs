import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const VOCAB_DIR = path.resolve(__dirname, '../vocabularies');

/**
 * 从文本文件或字符串中读取单词列表（忽略空行和 # 注释）
 */
export function parseWordList(content) {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
}

/**
 * 读取 vocabularies 目录下的词表文件
 */
export function loadVocabFile(fileName) {
  const filePath = path.isAbsolute(fileName) ? fileName : path.join(VOCAB_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`找不到词库文件: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return parseWordList(content);
}

/**
 * 数组去重并保留原始大小写顺序
 */
export function dedupeWords(wordList) {
  const seen = new Set();
  const result = [];
  for (const w of wordList) {
    const key = w.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(w.trim());
  }
  return result;
}
