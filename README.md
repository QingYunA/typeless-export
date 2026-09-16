# typeless-to-openless

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="package.json"><img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node Version"></a>
  <a href="package.json"><img src="https://img.shields.io/badge/version-1.0.0-orange.svg" alt="Version"></a>
</p>

导出 Typeless 本地词库，或直接导入到 OpenLess。自带 240+ 程序员与 AI 常用热词。

---

## 为什么做这个？

Typeless 免费额度从每周 8000 字降到了 2000 字。想换到开源免费的 OpenLess，但遇到了两个问题：

1. **Typeless 没有导出按钮**：平时积累的人名、项目代码、专业缩写都在里面，手动复制太慢。
2. **OpenLess 初始词库太少**：刚装上容易把 `PR` 识别成“批日”、把 `CI/CD` 识别成“吸哎吸低”、把 `v0` 识别成“微零”。

这个工具可以读取本地 Typeless 缓存并导出全部词库，也可以把导出的词库和整理好的程序员热词直接写进 OpenLess。

---

## 功能

- **自动读取凭据**：直接读取本地缓存并解密，不需要手动输入账号密码。
- **导出多种格式**：支持导出纯文本（每行一词）、CSV 表格（带分类与时间）和 JSON。
- **安全导入 OpenLess**：写入前自动备份为 `.bak`，自动去重，不影响已有词条。
- **自带 240+ 技术词汇**：整理了 Git 常用操作、前后端技术、主流大模型与 AI 编程工具名字。
- **零额外依赖**：纯 Node.js 内置模块实现，下载即可运行。

---

## 使用方法

### 方式一：一行命令直接运行（推荐，带交互菜单）

在 Mac 或 Linux 终端粘贴以下命令：

```bash
curl -fsSL https://raw.githubusercontent.com/QingYunA/typeless-to-openless/main/run.sh | bash
```

- **键盘上下键交互**：支持用 `↑` / `↓` 移动光标选择，按回车确认。
- **免安装 Node.js**：如果系统没有安装 Node，会自动使用 Typeless 内置的运行环境，开箱即用。

---

### 方式二：使用 npx 或命令行参数运行

```bash
# 1. 一键迁移：导出 Typeless 词库并直接导入 OpenLess
npx typeless-to-openless migrate

# 2. 只导出 Typeless 词库（在当前目录生成 txt、csv、json）
npx typeless-to-openless export

# 3. 将自带的 240+ 技术词汇导入 OpenLess
npx typeless-to-openless sync

# 4. 导入指定的词表文件到 OpenLess
npx typeless-to-openless import ./my_words.txt --preset "自定义词库"
```

### 方式二：克隆本地运行

```bash
git clone https://github.com/QingYunA/typeless-to-openless.git
cd typeless-to-openless

# 查看帮助
./bin/cli.mjs help

# 执行迁移
./bin/cli.mjs migrate
```

> **注意**：导入完成后，请退出 OpenLess（`Cmd + Q`）并重新打开，新词条才会生效。

---

## 词库文件

词库放在 `vocabularies/` 目录下：

| 文件 | 词数 | 说明 |
| :--- | :--- | :--- |
| [`vocabularies/programmer.txt`](./vocabularies/programmer.txt) | 240+ | 常见技术术语、主流大模型与 AI 编程工具热词 |

### 添加新词

1. 打开 `vocabularies/programmer.txt`，新起一行写上词语（支持 `#` 注释）。
2. 运行 `node ./bin/cli.mjs sync` 同步到 OpenLess。
3. 欢迎提 Pull Request 补充常见技术词。

---

## 数据路径

- **Typeless 本地数据**:
  - macOS: `~/Library/Application Support/Typeless/user-data.json`
  - Windows: `%APPDATA%/Typeless/user-data.json`
- **OpenLess 本地数据**:
  - macOS: `~/Library/Application Support/OpenLess/`
  - Windows: `%APPDATA%/OpenLess/`

---

## License

[MIT](LICENSE) © 2026 Serein
