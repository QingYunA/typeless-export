/**
 * 判断是否应使用英文输出 (Auto-detect English environment)
 * 优先级:
 * 1. 显式命令行参数 (--en / --zh / --lang=en / --lang=zh / --lang en / --lang zh)
 * 2. 显式环境变量 TLE_LANG
 * 3. 标准 POSIX 环境变量 (LC_ALL > LC_MESSAGES > LANG)
 * 4. Node.js Intl API 系统 locale
 * 5. 国际化开源项目默认：英文 (en)
 */
export function detectIsEnglish(rawArgs = [], env = process.env) {
  // 1. 显式命令行参数
  for (let i = 0; i < rawArgs.length; i++) {
    const a = rawArgs[i];
    if (a === '--en' || a === '--lang=en') return true;
    if (a === '--zh' || a === '--lang=zh') return false;
    if (a === '--lang' && rawArgs[i + 1]) {
      return !rawArgs[i + 1].toLowerCase().startsWith('zh');
    }
  }

  // 2. 显式环境变量
  if (env.TLE_LANG) {
    const lang = env.TLE_LANG.toLowerCase();
    if (lang.startsWith('zh')) return false;
    if (lang.startsWith('en')) return true;
  }

  // 3. POSIX 语言环境变量 (LC_ALL > LC_MESSAGES > LANG)
  const envLang = (env.LC_ALL || env.LC_MESSAGES || env.LANG || '').toLowerCase();
  if (envLang) {
    if (envLang.startsWith('zh')) return false;
    if (envLang.startsWith('en')) return true;
  }

  // 4. Node.js Intl API 系统 locale
  try {
    const locale = (Intl.DateTimeFormat().resolvedOptions().locale || '').toLowerCase();
    if (locale.startsWith('zh')) return false;
    if (locale.startsWith('en')) return true;
  } catch {}

  // 5. 国际化开源通用规则：非中文环境一律默认英文
  return true;
}

export function isEnglish(env = process.env) {
  return detectIsEnglish([], env);
}

export function i18n(enText, zhText, env = process.env) {
  return isEnglish(env) ? enText : zhText;
}
