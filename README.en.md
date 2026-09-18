<p align="center">
  <img src="assets/logo.svg" alt="Typeless Export Logo" width="80" height="80" />
</p>

<h1 align="center">Typeless Export</h1>

<p align="center">
  <b>Export local Typeless vocabulary and migrate to OpenLess and other voice dictation tools</b>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="package.json"><img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node Version"></a>
  <a href="package.json"><img src="https://img.shields.io/badge/version-1.0.6-orange.svg" alt="Version"></a>
</p>

<p align="center">
  <a href="README.md">简体中文</a> | <b>English</b>
</p>

---

## Why this exists

Typeless recently reduced its free plan from 8,000 words/week to 2,000 words/week. Many users want to switch to open-source or local alternatives like OpenLess, Wispr Flow, Superwhisper, or system text expansions, but run into an immediate blocker:

- **Typeless provides zero export options**: All the names, specialized technical terms, abbreviations, and hotwords you spent months training are locked inside the app. Copying them by hand is painful.

This tool automatically reads and decrypts your local Typeless credentials, exports your full dictionary into plain text (TXT), CSV, and JSON, and provides seamless one-click migration into OpenLess. Support for more speech-to-text tools will follow.

---

## Features

- **Automatic Credential Discovery**: Decrypts local caches offline — no need to type email, password, or API keys.
- **Multiple Export Formats**: Clean single-word-per-line text (TXT), detailed spreadsheets (CSV with categories and timestamps), and raw structured JSON.
- **Non-Intrusive Openless Presets**: Imports words as an independent Expansion Pack (Preset) in Openless without polluting your personal active hotword list. You choose whether to enable it in settings.
- **Bundled Technical Hotwords**: Includes 240+ high-frequency programming and AI developer terms ready to import.
- **Zero External Dependencies**: Implemented purely with Node.js built-ins.
- **Works Without Node**: Automatically falls back to Typeless's embedded runtime if Node.js is not installed on your system.

---

## Quick Start

### Method 1: Interactive Menu (Recommended)

Run directly in your terminal (auto-detects English/Chinese from your environment):

```bash
curl -fsSL https://cdn.jsdelivr.net/gh/QingYunA/typeless-export@main/run.sh | bash
```

Or via GitHub raw:

```bash
curl -fsSL https://raw.githubusercontent.com/QingYunA/typeless-export/main/run.sh | bash
```

> **Tip**: Language is automatically detected based on your system locale. You can also override it using `TLE_LANG=en` or `TLE_LANG=zh`.

- **Interactive Arrow Keys**: Use `↑` / `↓` (or `k` / `j`) to navigate, press `Enter` to confirm.
- **Three Core Features**:
  1. `Export Typeless vocabulary`: Enter output folder (defaults to `~` home directory), generating txt, csv, and json.
  2. `Export and migrate to Openless`: Creates an independent Openless expansion pack; enabling it is up to you.
  3. `Sync programmer terms and AI hotwords to Openless`: Adds curated developer hotwords to Openless as a toggleable pack.
- **No Node.js Required**: Uses Typeless's built-in runtime if Node is not found on your system.

---

### Method 2: Command Line (CLI / npx)

```bash
# 1. Export Typeless vocabulary (defaults to ~ home directory, or pass a custom directory)
npx typeless-export export --en
npx typeless-export export ~/Downloads --en

# 2. Export and migrate directly to Openless
npx typeless-export migrate --en

# 3. Sync bundled 240+ programmer & AI hotwords to Openless
npx typeless-export sync --en
```

---

### Method 3: Clone & Run Locally

```bash
git clone https://github.com/QingYunA/typeless-export.git
cd typeless-export

# Run English interactive menu
./run.en.sh

# Or run CLI commands
./bin/cli.mjs export --en
```

---

## Exported Formats

1. **`typeless_words.txt`**: One term per line. Ready to copy-paste or import into any input method.
2. **`typeless_words.csv`**: Contains term, category (person / product / jargon), language, auto-learned flag, and created date.
3. **`typeless_words.json`**: Complete raw data structure.

---

## Bundled Vocabularies

Pre-curated vocabularies are maintained in `vocabularies/`:

| File | Terms | Description |
| :--- | :--- | :--- |
| [`vocabularies/programmer.txt`](./vocabularies/programmer.txt) | 240+ | Git commands, frontend, backend, databases, and mainstream AI models |

PRs are welcome for specialized vocabularies in other industries!

---

## Local Data Paths

- **Typeless Local Data**:
  - macOS: `~/Library/Application Support/Typeless/user-data.json`
  - Windows: `%APPDATA%/Typeless/user-data.json`
- **OpenLess Local Data**:
  - macOS: `~/Library/Application Support/OpenLess/`
  - Windows: `%APPDATA%/OpenLess/`

---

## License

[MIT](LICENSE) © 2026 Serein
