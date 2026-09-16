#!/usr/bin/env bash

# ==============================================================================
# Typeless Export (tle) - 词库导出与迁移助手
# 支持通过 curl -fsSL ... | bash 直接运行，并支持键盘上下键交互选择
# ==============================================================================

set -e

# 如果通过管道运行 (curl | bash)，将标准输入重定向至当前终端控制台
if [ ! -t 0 ]; then
  exec < /dev/tty 2>/dev/null || true
fi

# 1. 确定运行环境与项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd || echo "")"
CACHE_DIR="$HOME/.typeless-export"

if [ -f "$SCRIPT_DIR/bin/cli.mjs" ]; then
  PROJECT_ROOT="$SCRIPT_DIR"
else
  PROJECT_ROOT="$CACHE_DIR"
  if [ ! -f "$PROJECT_ROOT/bin/cli.mjs" ]; then
    echo "正在下载最新代码..."
    mkdir -p "$PROJECT_ROOT"
    if ! curl -sSL --connect-timeout 5 "https://github.com/QingYunA/typeless-export/archive/refs/heads/main.tar.gz" | tar -xz -C "$PROJECT_ROOT" --strip-components=1 2>/dev/null; then
      echo "直连较慢，正在使用加速节点下载..."
      curl -sSL --connect-timeout 10 "https://ghproxy.net/https://github.com/QingYunA/typeless-export/archive/refs/heads/main.tar.gz" | tar -xz -C "$PROJECT_ROOT" --strip-components=1
    fi
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
  echo "错误: 未检测到 Node.js 或 Typeless 运行时。"
  echo "请先安装 Node.js (https://nodejs.org) 或确认安装了 Typeless 客户端。"
  exit 1
fi

CLI_PATH="$PROJECT_ROOT/bin/cli.mjs"

# 如果传递了子命令参数 (如 ./run.sh export)，直接静默执行，不打开菜单
if [ -n "$1" ]; then
  exec "$JS_RUNNER" "$CLI_PATH" "$@"
fi

# 3. 终端交互菜单设计
options=(
  "导出 Typeless 词库 (保存为 txt, csv, json)"
  "一键迁移到 OpenLess (导出并写入 OpenLess 词典)"
  "同步 240+ 程序员与 AI 热词到 OpenLess"
  "导入自定义词表文件到 OpenLess"
  "安装 tle 命令到终端 (支持以后直接运行 tle)"
  "退出"
)

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

echo ""
echo "=============================================="
echo "  Typeless Export - 词库导出与迁移助手"
echo "=============================================="
echo "请使用 ↑ / ↓ 键选择操作，按 Enter 回车确认："
echo ""

printf "\033[?25l" # 隐藏光标
print_menu "first"

# 键盘监听循环
while true; do
  IFS= read -r -s -n 1 key
  if [[ $key == $'\x1b' ]]; then
    read -r -s -n 2 rest
    case "$rest" in
      "[A"|"k") # 上方向键或 k
        ((selected--))
        if [ $selected -lt 0 ]; then
          selected=$((${#options[@]} - 1))
        fi
        print_menu "redraw"
        ;;
      "[B"|"j") # 下方向键或 j
        ((selected++))
        if [ $selected -ge ${#options[@]} ]; then
          selected=0
        fi
        print_menu "redraw"
        ;;
    esac
  elif [[ $key == "1" ]]; then
    selected=0; print_menu "redraw"; break
  elif [[ $key == "2" ]]; then
    selected=1; print_menu "redraw"; break
  elif [[ $key == "3" ]]; then
    selected=2; print_menu "redraw"; break
  elif [[ $key == "4" ]]; then
    selected=3; print_menu "redraw"; break
  elif [[ $key == "5" ]]; then
    selected=4; print_menu "redraw"; break
  elif [[ $key == "6" || $key == "q" ]]; then
    selected=5; print_menu "redraw"; break
  elif [[ -z "$key" ]]; then # 回车键
    break
  fi
done

printf "\033[?25h" # 恢复光标
echo ""

# 4. 执行选中的指令
case $selected in
  0)
    "$JS_RUNNER" "$CLI_PATH" export
    ;;
  1)
    "$JS_RUNNER" "$CLI_PATH" migrate
    ;;
  2)
    "$JS_RUNNER" "$CLI_PATH" sync
    ;;
  3)
    read -r -p "请输入要导入的词表文件路径: " input_file
    if [ -f "$input_file" ]; then
      read -r -p "请输入预设分类名称 [默认: 自定义词库]: " input_preset
      input_preset="${input_preset:-自定义词库}"
      "$JS_RUNNER" "$CLI_PATH" import "$input_file" --preset "$input_preset"
    else
      echo "错误: 找不到文件 $input_file"
      exit 1
    fi
    ;;
  4)
    # 安装到用户 PATH
    INSTALL_BIN_DIR="/usr/local/bin"
    if [ ! -w "$INSTALL_BIN_DIR" ]; then
      INSTALL_BIN_DIR="$HOME/.local/bin"
      mkdir -p "$INSTALL_BIN_DIR"
    fi

    WRAPPER="$INSTALL_BIN_DIR/tle"
    cat << WRAPPER_EOF > "$WRAPPER"
#!/usr/bin/env bash
exec bash "$PROJECT_ROOT/run.sh" "\$@"
WRAPPER_EOF
    chmod +x "$WRAPPER"

    echo "✓ 已成功将 tle 安装至 $WRAPPER"
    echo "现在你可以在任意终端窗口直接输入 tle 打开本菜单！"
    ;;
  5)
    echo "已退出。"
    exit 0
    ;;
esac
