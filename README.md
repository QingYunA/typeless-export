# typeless-export

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="package.json"><img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node Version"></a>
  <a href="package.json"><img src="https://img.shields.io/badge/version-1.0.0-orange.svg" alt="Version"></a>
</p>

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
- **一键导入 OpenLess**：支持直接将导出的词库安全写入 OpenLess，自动备份、智能去重。
- **自带 240+ 技术词汇**：内置一份整理好的高频程序员与 AI 技术词库，可直接导入。
- **零额外依赖**：纯 Node.js 内置模块实现，开箱即用。

---

## 使用方法

### 方式一：一行命令直接运行（推荐，带交互菜单）

在 Mac 或 Linux 终端粘贴以下任一命令即可：

```bash
# 国内直连加速（推荐，免翻墙）
curl -fsSL https://fastly.jsdelivr.net/gh/QingYunA/typeless-export@main/run.sh | bash

# GitHub 官方源
curl -fsSL https://raw.githubusercontent.com/QingYunA/typeless-export/main/run.sh | bash
```

- **键盘上下键交互**：支持用 `↑` / `↓` 移动光标选择，按回车确认。
- **免安装 Node.js**：如果系统没有安装 Node，会自动使用 Typeless 内置的运行环境，小白直接用。

---

### 方式二：使用 npx 或命令行参数运行

```bash
# 1. 导出 Typeless 词库（在当前目录生成 txt、csv、json）
npx typeless-export export

# 2. 一键迁移到 OpenLess（导出 Typeless 并直接写入 OpenLess）
npx typeless-export migrate

# 3. 将内置的 240+ 程序员技术词汇导入 OpenLess
npx typeless-export sync

# 4. 导入指定的词表文件到 OpenLess
npx typeless-export import ./my_words.txt --preset "自定义词库"
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
