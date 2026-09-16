import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

// 兼容 CryptoJS 的 AES 秘钥派生 (EVP_BytesToKey)
function evpBytesToKey(passphrase, salt, keyLen, ivLen) {
  let d = Buffer.alloc(0);
  let total = Buffer.alloc(0);
  while (total.length < keyLen + ivLen) {
    const hash = crypto.createHash('md5');
    hash.update(d);
    hash.update(passphrase);
    hash.update(salt);
    d = hash.digest();
    total = Buffer.concat([total, d]);
  }
  return {
    key: total.subarray(0, keyLen),
    iv: total.subarray(keyLen, keyLen + ivLen),
  };
}

function cryptoJsAesEncrypt(plainText, passphrase) {
  const salt = crypto.randomBytes(8);
  const { key, iv } = evpBytesToKey(Buffer.from(passphrase, 'utf8'), salt, 32, 16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(plainText, 'utf8')),
    cipher.final(),
  ]);
  const full = Buffer.concat([Buffer.from('Salted__', 'utf8'), salt, encrypted]);
  return full.toString('base64');
}

export function getTypelessUserDataPath() {
  const platform = os.platform();
  if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library/Application Support/Typeless/user-data.json');
  } else if (platform === 'win32') {
    return path.join(process.env.APPDATA || '', 'Typeless/user-data.json');
  } else {
    return path.join(os.homedir(), '.config/Typeless/user-data.json');
  }
}

export function decryptTypelessAuth() {
  const userdataPath = getTypelessUserDataPath();
  if (!fs.existsSync(userdataPath)) {
    throw new Error(`未找到 Typeless 用户数据文件 (${userdataPath})，请确认已安装并登录过 Typeless。`);
  }

  const platform = os.platform();
  const arch = os.arch();
  const appName = 'Typeless';

  // 派生主解密密钥
  const hash = crypto.createHash('sha256').update(`${platform}-${arch}`).digest('hex');
  const encryptionKey = crypto.pbkdf2Sync(hash + appName, 'typeless-user-service', 10000, 32, 'sha256');

  const rawData = fs.readFileSync(userdataPath);
  const iv = rawData.subarray(0, 16);
  const ciphertext = rawData.subarray(17);

  const password = crypto.pbkdf2Sync(encryptionKey, iv.toString(), 10000, 32, 'sha512');
  const decipher = crypto.createDecipheriv('aes-256-cbc', password, iv);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');

  const parsed = JSON.parse(decrypted);
  const userData = JSON.parse(parsed.userData);

  return {
    userId: userData.user_id,
    token: userData.access_token,
    email: userData.email,
  };
}

export async function fetchTypelessDictionary(userId, token) {
  const timestamp = Date.now();
  const appVersion = 'mac_2.7.0';
  const pathname = '/user/dictionary/list';
  const Lu = 'c66a8b482a79f11217b3487a523debcea43d288adde6068d56dc050b';
  const En = '1a0b8ae1a2e0a71ab8cdb6749b27a3a10f09be18931eb87a7e8d6469';

  const signStr = `${timestamp}:${appVersion}:${pathname}:${userId}`;
  const sha1SecretKey = `${timestamp}:${Lu}`;
  const sha1Hash = crypto.createHmac('sha1', sha1SecretKey).update(signStr).digest('hex');

  const authPayload = {
    'X-Env': 'prod',
    'X-Client-Domain': '',
    'X-Client-Path': '',
    'X-Random': Math.floor(100000 + Math.random() * 900000).toString(),
    t: timestamp,
    p: sha1Hash,
    d: 'UNKNOWN',
    '3c86e26ccbb7274f752e7d868a1541ebfb7f37e7': { a: '' },
  };

  const encryptedAuth = cryptoJsAesEncrypt(JSON.stringify(authPayload), En);

  const url = 'https://api.typeless.com/user/dictionary/list?size=5000';
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Browser-Name': 'Typeless',
      'X-Browser-Version': '2.7.0',
      'X-Browser-Major': '2',
      'X-App-Version': appVersion,
      'X-Authorization': encryptedAuth,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Typeless API 请求失败: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  if (result.status !== 'OK' && result.code !== 200) {
    throw new Error(`Typeless API 返回错误: ${result.message || result.msg || JSON.stringify(result)}`);
  }

  return result.data?.words || [];
}

export async function exportTypelessToFile(outDir = process.cwd()) {
  const auth = decryptTypelessAuth();
  const words = await fetchTypelessDictionary(auth.userId, auth.token);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const txtPath = path.join(outDir, 'typeless_words.txt');
  const csvPath = path.join(outDir, 'typeless_words.csv');
  const jsonPath = path.join(outDir, 'typeless_words.json');

  // 1. TXT
  const terms = words.map(w => w.term || w.word).filter(Boolean);
  fs.writeFileSync(txtPath, terms.join('\n') + '\n', 'utf8');

  // 2. CSV
  const csvLines = [
    ['term', 'category', 'lang', 'auto_learned', 'created_at'].join(','),
    ...words.map(w => [
      `"${(w.term || '').replace(/"/g, '""')}"`,
      `"${w.category || ''}"`,
      `"${w.lang || ''}"`,
      w.auto ? 'true' : 'false',
      `"${w.created_at || ''}"`,
    ].join(',')),
  ];
  fs.writeFileSync(csvPath, csvLines.join('\n') + '\n', 'utf8');

  // 3. JSON
  fs.writeFileSync(jsonPath, JSON.stringify(words, null, 2), 'utf8');

  return {
    email: auth.email,
    userId: auth.userId,
    words,
    terms,
    txtPath,
    csvPath,
    jsonPath,
  };
}
