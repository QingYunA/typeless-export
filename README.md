# typeless-export

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="package.json"><img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node Version"></a>
  <a href="package.json"><img src="https://img.shields.io/badge/version-1.0.0-orange.svg" alt="Version"></a>
</p>

<p align="center">
  <b>简体中文</b> | <a href="README.en.md">English</a>
</p>

```text
  _____                 __                ______                     __ 
 /_  __/_ _____  ___   / /__ ___ ___     / ____/_ __ ___  ___  ____ / /_
  / / / // / _ \/ -_) / / -_|_-<(_-<    / __/  \ \ // _ \/ _ \/ __// __/
 /_/  \_, / .__/\__/ /_/\__/___/___/   /_____//_\_\/ .__/\___/_/   \__/ 
     /___/_/                                      /_/                   
```

导出 Typeless 本地个人词库，支持迁移到各类语音输入工具（首发支持一键导入 OpenLess）。

---

## 为什么做这个？

Typeless 最近把免费额度从每周 8000 字降到了 2000 字。很多用户想迁移到其他语音工具（如 OpenLess、Wispr Flow、Superwhisper 或输入法自定义短语），但遇到了痛点：

- **Typeless 官方没有导出功能**：长期积累的人名、公司缩写、专有名词全被锁在软件里，手动复制非常费劲。

这个工具可以直接读取本地 Typeless 缓存并导出全部词库（TXT、CSV、JSON），并提供了一键导入 OpenLess 的功能。后续将持续扩展支持更多语音助手的格式转换与自动导入。

---

## 功能

- **自动读取凭据**：直接读取本地缓存并解密，不需要手动输入账号密码。
- **导出多种格式**：支持导出纯文本（每行一词）、CSV 表格（带分类与时间）和 JSON 格式。
- **一键生成 Openless 拓展集**：将词库作为独立的拓展集（Preset）导入 Openless，不污染个人日常词库，由你在设置中自主决定是否启用。
- **自带 240+ 技术词汇**：内置一份整理好的高频程序员与 AI 技术词库，可直接导入。
- **零额外依赖**：纯 Node.js 内置模块实现，开箱即用。

---

## 使用方法

### 方式一：一行命令直接运行（推荐，带交互菜单）

在终端粘贴以下命令即可运行（免科学上网、走 CDN 极速直连）：

```bash
bash -c "$(curl -fsSL https://cdn.jsdelivr.net/gh/QingYunA/typeless-export@main/run.sh)"
```

或者通过 GitHub 原生地址：

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/QingYunA/typeless-export/main/run.sh)"
```

- **三大核心功能**：
  1. `导出 Typeless 词库`：输入保存目录（默认直接保存至 `~` 家目录），生成 txt、csv、json。
  2. `导出并迁移到 Openless`：一键生成 Openless 独立拓展集，是否启用由你勾选。
  3. `同步程序员常用词语、AI 热词到 Openless`：将常用编程与 AI 词汇添加至拓展集，随用随启。
- **键盘上下键交互**：支持用 `↑` / `↓`（或 `k` / `j`）移动光标选择，按回车确认。
- **免安装 Node.js**：如果系统没有安装 Node，会自动使用 Typeless 内置的运行环境，开箱即用。

---

### 方式二：使用 npx 或命令行参数运行

```bash
# 1. 导出 Typeless 词库（默认保存至 ~ 家目录，也可指定目录如 ~/Downloads）
npx typeless-export export
npx typeless-export export ~/Downloads

# 2. 导出并一键迁移到 Openless
npx typeless-export migrate

# 3. 将内置的 240+ 程序员常用词语与 AI 热词导入 Openless
npx typeless-export sync
```

### 方式三：克隆本地运行

```bash
git clone https://github.com/QingYunA/typeless-export.git
cd typeless-export

# 查看帮助
./bin/cli.mjs help

# 执行导出
./bin/cli.mjs export
```

---

## 导出格式示例

导出的文件包含：
1. **`typeless_words.txt`**：每行一个词，方便直接复制粘贴或导入任何输入法。
2. **`typeless_words.csv`**：包含词条、分类（人名/术语/产品）、语言、是否自动学习、创建时间。
3. **`typeless_words.json`**：完整原始数据结构。

---

## 内置词库

仓库在 `vocabularies/` 目录下维护了高质量的预设词库：

| 文件 | 词数 | 说明 |
| :--- | :--- | :--- |
| [`vocabularies/programmer.txt`](./vocabularies/programmer.txt) | 240+ | 涵盖 Git 研发、前端、后端、数据库、主流大模型与 AI 编程工具 |

欢迎提交 PR 补充各行各业的常用专业词库！

---

## 数据路径说明

- **Typeless 本地数据**:
  - macOS: `~/Library/Application Support/Typeless/user-data.json`
  - Windows: `%APPDATA%/Typeless/user-data.json`
- **OpenLess 本地数据**:
  - macOS: `~/Library/Application Support/OpenLess/`
  - Windows: `%APPDATA%/OpenLess/`

---

## License

[MIT](LICENSE) © 2026 Serein

## 谢谢你
https://linux.do/
