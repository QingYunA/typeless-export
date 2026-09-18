#!/usr/bin/env bash

# ==============================================================================
# Typeless Export (tle) - 词库导出与迁移助手 / Vocabulary Export & Migration Tool
# 支持通过 curl -fsSL ... | bash 直接运行，并支持键盘上下键交互选择
# Supports curl -fsSL ... | bash with interactive arrow-key navigation
# ==============================================================================

set -e

VERSION="1.0.6"

# ------------------------------------------------------------------------------
# 语言环境自动检测 (i18n Auto-Detection)
# 优先级:
# 1. 显式命令行参数 (--en / --zh / --lang=en / --lang=zh)
# 2. 显式环境变量 TLE_LANG
# 3. POSIX 语言环境变量 (LC_ALL > LC_MESSAGES > LANG)
# 4. macOS 专属全局偏好 (AppleLocale / AppleLanguages) 兜底
# 5. 国际化开源通用默认值：英文 (en)
# ------------------------------------------------------------------------------
detect_language() {
  # 1. 命令行参数优先
  local args_copy=("$@")
  for ((i=0; i<${#args_copy[@]}; i++)); do
    case "${args_copy[i]}" in
      --en|--lang=en) echo "en"; return ;;
      --zh|--lang=zh) echo "zh"; return ;;
      --lang)
        local next_val="${args_copy[i+1]:-}"
        case "$next_val" in
          zh*|ZH*) echo "zh"; return ;;
          *)       echo "en"; return ;;
        esac
        ;;
    esac
  done

  # 2. 显式环境变量
  if [ -n "$TLE_LANG" ]; then
    case "$TLE_LANG" in
      zh*|ZH*) echo "zh"; return ;;
      *)       echo "en"; return ;;
    esac
  fi

  # 3. 标准 POSIX 环境变量 (LC_ALL > LC_MESSAGES > LANG)
  local env_lang="${LC_ALL:-${LC_MESSAGES:-${LANG:-}}}"
  case "$env_lang" in
    zh*|ZH*) echo "zh"; return ;;
    en*|EN*) echo "en"; return ;;
  esac

  # 4. macOS 系统首选语言兜底 (针对某些终端或子 shell 中 LANG 为空或 C.UTF-8 的情况)
  if [ "$(uname)" = "Darwin" ]; then
    local mac_locale
    mac_locale="$(defaults read -g AppleLocale 2>/dev/null || true)"
    case "$mac_locale" in
      zh*) echo "zh"; return ;;
      en*) echo "en"; return ;;
    esac

    # 仅检测首选语言 (AppleLanguages 数组第 2 行的第一项首选项，避免次选语言误命中)
    local primary_lang
    primary_lang="$(defaults read -g AppleLanguages 2>/dev/null | sed -n '2p' || true)"
    if echo "$primary_lang" | grep -qi "zh"; then
      echo "zh"
      return
    fi
  fi

  # 5. 默认回退到英文
  echo "en"
}

export TLE_LANG="$(detect_language "$@")"

# ------------------------------------------------------------------------------
# 多语言文案配置 (i18n Messages)
# ------------------------------------------------------------------------------
if [ "$TLE_LANG" = "zh" ]; then
  TXT_UPDATING="正在更新核心组件 ($VERSION)..."
  TXT_MIRROR_DOWNLOAD="直连较慢，正在使用加速节点下载..."
  TXT_ERR_NO_RUNTIME="错误: 未检测到 Node.js 或 Typeless 运行时。"
  TXT_ERR_INSTALL="请先安装 Node.js (https://nodejs.org) 或确认安装了 Typeless 客户端。"
  TXT_SUBTITLE="       Typeless Export (tle) · 词库导出与 Openless 迁移助手"
  TXT_HINT=" 请使用 ↑ / ↓ 键选择操作，按 Enter 回车确认："
  TXT_DIR_PROMPT="请输入导出目录 [默认: ~]: "
  TXT_EXITED="已退出。"

  options=(
    "导出 Typeless 词库"
    "导出并迁移到 Openless"
    "同步程序员常用词语、AI 热词到 Openless"
    "退出"
  )
else
  TXT_UPDATING="Updating core components ($VERSION)..."
  TXT_MIRROR_DOWNLOAD="Direct download slow, trying mirror..."
  TXT_ERR_NO_RUNTIME="Error: Neither Node.js nor Typeless runtime detected."
  TXT_ERR_INSTALL="Please install Node.js (https://nodejs.org) or install the Typeless app."
  TXT_SUBTITLE="       Typeless Export (tle) · Vocabulary Export & Openless Migration"
  TXT_HINT=" Use ↑ / ↓ arrow keys to select, press Enter to confirm:"
  TXT_DIR_PROMPT="Enter export directory [default: ~]: "
  TXT_EXITED="Exited."

  options=(
    "Export Typeless vocabulary"
    "Export and migrate to Openless"
    "Sync programmer terms and AI hotwords to Openless"
    "Exit"
  )
fi

# 1. 确定运行环境与项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd || echo "")"
CACHE_DIR="$HOME/.typeless-export"

if [ -f "$SCRIPT_DIR/bin/cli.mjs" ]; then
  PROJECT_ROOT="$SCRIPT_DIR"
else
  PROJECT_ROOT="$CACHE_DIR"
  INSTALLED_VER=""
  [ -f "$PROJECT_ROOT/.version" ] && INSTALLED_VER="$(cat "$PROJECT_ROOT/.version" 2>/dev/null || true)"

  if [ "$INSTALLED_VER" != "$VERSION" ] || [ ! -f "$PROJECT_ROOT/bin/cli.mjs" ]; then
    echo "$TXT_UPDATING"
    mkdir -p "$PROJECT_ROOT"
    if ! curl -sSL --connect-timeout 5 "https://github.com/QingYunA/typeless-export/archive/refs/heads/main.tar.gz" | tar -xz -C "$PROJECT_ROOT" --strip-components=1 2>/dev/null; then
      echo "$TXT_MIRROR_DOWNLOAD"
      curl -sSL --connect-timeout 10 "https://ghproxy.net/https://github.com/QingYunA/typeless-export/archive/refs/heads/main.tar.gz" | tar -xz -C "$PROJECT_ROOT" --strip-components=1
    fi
    echo "$VERSION" > "$PROJECT_ROOT/.version"
  fi
fi

# 2. 检测 JavaScript 运行时
# 优先使用系统 node；若未安装 node，则自动使用 Typeless.app 内置的运行环境
if command -v node >/dev/null 2>&1; then
  JS_RUNNER="node"
elif [ -x "/Applications/Typeless.app/Contents/MacOS/Typeless" ]; then
  export ELECTRON_RUN_AS_NODE=1
  JS_RUNNER="/Applications/Typeless.app/Contents/MacOS/Typeless"
else
  echo "$TXT_ERR_NO_RUNTIME"
  echo "$TXT_ERR_INSTALL"
  exit 1
fi

CLI_PATH="$PROJECT_ROOT/bin/cli.mjs"

# 如果传递了子命令参数 (如 ./run.sh export)，直接静默执行，不打开菜单
cmd_args=()
skip_next=0
for ((i=1; i<=$#; i++)); do
  if [ "$skip_next" -eq 1 ]; then
    skip_next=0
    continue
  fi
  arg="${!i}"
  case "$arg" in
    --en|--lang=en|--zh|--lang=zh)
      ;;
    --lang)
      skip_next=1
      ;;
    *)
      cmd_args+=("$arg")
      ;;
  esac
done

if [ ${#cmd_args[@]} -gt 0 ]; then
  exec "$JS_RUNNER" "$CLI_PATH" "${cmd_args[@]}"
fi

# 3. 终端交互菜单设计
selected=0

# 退出时恢复终端光标
cleanup() {
  printf "\033[?25h" # 显示光标
  echo ""
}
trap cleanup EXIT INT TERM

print_menu() {
  if [ "$1" = "redraw" ]; then
    printf "\033[%dA" "${#options[@]}"
  fi

  for i in "${!options[@]}"; do
    if [ "$i" -eq "$selected" ]; then
      printf "\033[1;36m❯ %s\033[0m\033[K\n" "${options[$i]}"
    else
      printf "  %s\033[K\n" "${options[$i]}"
    fi
  done
}

# 终端菜单输入设备检测
if [ -n "$TLE_INPUT_DEV" ]; then
  INPUT_DEV="$TLE_INPUT_DEV"
elif [ -r /dev/tty ]; then
  INPUT_DEV="/dev/tty"
else
  INPUT_DEV="/dev/stdin"
fi

if [ -n "${BASH_VERSINFO[0]}" ] && [ "${BASH_VERSINFO[0]}" -ge 4 ]; then
  ESC_TIMEOUT="-t 0.1"
else
  ESC_TIMEOUT="-t 1"
fi

echo ""
printf "\033[1;36m  _____                 __                ______                     __ \033[0m\n"
printf "\033[1;36m /_  __/_ _____  ___   / /__ ___ ___     / ____/_ __ ___  ___  ____ / /_\033[0m\n"
printf "\033[1;36m  / / / // / _ \\/ -_) / / -_|_-<(_-<    / __/  \\ \\ // _ \\/ _ \\/ __// __/\033[0m\n"
printf "\033[1;36m /_/  \\_, / .__/\\__/ /_/\\__/___/___/   /_____//_\\_\\/ .__/\\___/_/   \\__/ \033[0m\n"
printf "\033[1;36m     /___/_/                                      /_/                   \033[0m\n"
echo ""
echo "$TXT_SUBTITLE"
echo " ───────────────────────────────────────────────────────────────────"
echo "$TXT_HINT"
echo ""

# 临时关闭 set -e 以免交互循环中的按键判断或非零返回中断脚本
set +e

printf "\033[?25l" # 隐藏光标
print_menu "first"

# 键盘监听循环 (通过 INPUT_DEV 读取用户按键，绝不能重定向 bash 的 stdin)
while true; do
  IFS= read -r -s -n 1 key < "$INPUT_DEV" || true
  if [[ $key == $'\x1b' ]]; then
    read $ESC_TIMEOUT -r -s -n 2 rest < "$INPUT_DEV" || rest=""
    case "$rest" in
      "[A"|"OA") # 上方向键
        selected=$(( (selected - 1 + ${#options[@]}) % ${#options[@]} ))
        print_menu "redraw"
        ;;
      "[B"|"OB") # 下方向键
        selected=$(( (selected + 1) % ${#options[@]} ))
        print_menu "redraw"
        ;;
    esac
  elif [[ $key == "k" || $key == "K" ]]; then
    selected=$(( (selected - 1 + ${#options[@]}) % ${#options[@]} ))
    print_menu "redraw"
  elif [[ $key == "j" || $key == "J" ]]; then
    selected=$(( (selected + 1) % ${#options[@]} ))
    print_menu "redraw"
  elif [[ $key == "1" ]]; then
    selected=0; print_menu "redraw"; break
  elif [[ $key == "2" ]]; then
    selected=1; print_menu "redraw"; break
  elif [[ $key == "3" ]]; then
    selected=2; print_menu "redraw"; break
  elif [[ $key == "4" || $key == "q" || $key == "Q" ]]; then
    selected=3; print_menu "redraw"; break
  elif [[ -z "$key" ]]; then # 回车键
    break
  fi
done

# 恢复 set -e 模式
set -e

printf "\033[?25h" # 恢复光标
echo ""

# 4. 执行选中的指令
case $selected in
  0)
    read -r -p "$TXT_DIR_PROMPT" export_dir < "$INPUT_DEV"
    export_dir="${export_dir:-$HOME}"
    export_dir="${export_dir/#\~/$HOME}"
    "$JS_RUNNER" "$CLI_PATH" export "$export_dir"
    ;;
  1)
    "$JS_RUNNER" "$CLI_PATH" migrate
    ;;
  2)
    "$JS_RUNNER" "$CLI_PATH" sync
    ;;
  3)
    echo "$TXT_EXITED"
    exit 0
    ;;
esac
