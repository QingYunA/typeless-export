import test from 'node:test';
import assert from 'node:assert/strict';
import { detectIsEnglish } from '../src/i18n.mjs';

test('detectIsEnglish prioritizes CLI arguments', () => {
  assert.equal(detectIsEnglish(['--en'], { TLE_LANG: 'zh' }), true);
  assert.equal(detectIsEnglish(['--lang=en'], { TLE_LANG: 'zh' }), true);
  assert.equal(detectIsEnglish(['--zh'], { TLE_LANG: 'en' }), false);
  assert.equal(detectIsEnglish(['--lang=zh'], { TLE_LANG: 'en' }), false);
});

test('detectIsEnglish checks TLE_LANG environment variable', () => {
  assert.equal(detectIsEnglish([], { TLE_LANG: 'zh' }), false);
  assert.equal(detectIsEnglish([], { TLE_LANG: 'zh_CN' }), false);
  assert.equal(detectIsEnglish([], { TLE_LANG: 'en' }), true);
  assert.equal(detectIsEnglish([], { TLE_LANG: 'en_US' }), true);
});

test('detectIsEnglish checks POSIX locale environment variables with correct precedence', () => {
  // LC_ALL has highest precedence
  assert.equal(detectIsEnglish([], { LC_ALL: 'zh_CN.UTF-8', LANG: 'en_US.UTF-8' }), false);
  assert.equal(detectIsEnglish([], { LC_ALL: 'en_US.UTF-8', LANG: 'zh_CN.UTF-8' }), true);

  // LC_MESSAGES has precedence over LANG
  assert.equal(detectIsEnglish([], { LC_MESSAGES: 'zh_CN.UTF-8', LANG: 'en_US.UTF-8' }), false);
  assert.equal(detectIsEnglish([], { LC_MESSAGES: 'en_US.UTF-8', LANG: 'zh_CN.UTF-8' }), true);

  // LANG is fallback
  assert.equal(detectIsEnglish([], { LANG: 'zh_CN.UTF-8' }), false);
  assert.equal(detectIsEnglish([], { LANG: 'zh_TW.UTF-8' }), false);
  assert.equal(detectIsEnglish([], { LANG: 'en_US.UTF-8' }), true);
});

test('detectIsEnglish defaults to English for non-Chinese environments', () => {
  assert.equal(detectIsEnglish([], { LANG: 'ja_JP.UTF-8' }), true);
  assert.equal(detectIsEnglish([], { LANG: 'de_DE.UTF-8' }), true);
});
