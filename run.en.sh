#!/usr/bin/env bash

# ==============================================================================
# Typeless Export (tle) - Vocabulary Export & Migration Tool
# Supports curl -fsSL ... | bash with interactive arrow-key navigation
# ==============================================================================

set -e
export TLE_LANG=en

VERSION="1.0.6"

# 1. Determine execution directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd || echo "")"
CACHE_DIR="$HOME/.typeless-export"

if [ -f "$SCRIPT_DIR/bin/cli.mjs" ]; then
  PROJECT_ROOT="$SCRIPT_DIR"
else
  PROJECT_ROOT="$CACHE_DIR"
  INSTALLED_VER=""
  [ -f "$PROJECT_ROOT/.version" ] && INSTALLED_VER="$(cat "$PROJECT_ROOT/.version" 2>/dev/null || true)"

  if [ "$INSTALLED_VER" != "$VERSION" ] || [ ! -f "$PROJECT_ROOT/bin/cli.mjs" ]; then
    echo "Updating core components ($VERSION)..."
    mkdir -p "$PROJECT_ROOT"
    if ! curl -sSL --connect-timeout 5 "https://github.com/QingYunA/typeless-export/archive/refs/heads/main.tar.gz" | tar -xz -C "$PROJECT_ROOT" --strip-components=1 2>/dev/null; then
      echo "Direct download slow, trying mirror..."
      curl -sSL --connect-timeout 10 "https://ghproxy.net/https://github.com/QingYunA/typeless-export/archive/refs/heads/main.tar.gz" | tar -xz -C "$PROJECT_ROOT" --strip-components=1
    fi
    echo "$VERSION" > "$PROJECT_ROOT/.version"
  fi
fi

# 2. Detect JavaScript runtime
if command -v node >/dev/null 2>&1; then
  JS_RUNNER="node"
elif [ -x "/Applications/Typeless.app/Contents/MacOS/Typeless" ]; then
  export ELECTRON_RUN_AS_NODE=1
  JS_RUNNER="/Applications/Typeless.app/Contents/MacOS/Typeless"
else
  echo "Error: Neither Node.js nor Typeless runtime detected."
  echo "Please install Node.js (https://nodejs.org) or install the Typeless app."
  exit 1
fi

CLI_PATH="$PROJECT_ROOT/bin/cli.mjs"

# If subcommands passed (e.g. ./run.en.sh export), run directly
if [ -n "$1" ]; then
  exec "$JS_RUNNER" "$CLI_PATH" "$@"
fi

# 3. Interactive terminal menu
options=(
  "Export Typeless vocabulary"
  "Export and migrate to Openless"
  "Sync programmer terms and AI hotwords to Openless"
  "Exit"
)

selected=0

# Restore cursor on exit
cleanup() {
  printf "\033[?25h"
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

# Input device detection
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
echo "    Typeless Export (tle) · Vocabulary Export & Migration Tool"
echo " ───────────────────────────────────────────────────────────────────"
echo " Use ↑ / ↓ keys to navigate, press Enter to confirm:"
echo ""

# Temporarily disable set -e for interactive loop
set +e

printf "\033[?25l" # Hide cursor
print_menu "first"

# Keyboard listening loop
while true; do
  IFS= read -r -s -n 1 key < "$INPUT_DEV" || true
  if [[ $key == $'\x1b' ]]; then
    read $ESC_TIMEOUT -r -s -n 2 rest < "$INPUT_DEV" || rest=""
    case "$rest" in
      "[A"|"OA") # Up arrow
        selected=$(( (selected - 1 + ${#options[@]}) % ${#options[@]} ))
        print_menu "redraw"
        ;;
      "[B"|"OB") # Down arrow
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
  elif [[ -z "$key" ]]; then # Enter
    break
  fi
done

# Re-enable set -e
set -e

printf "\033[?25h" # Restore cursor
echo ""

# 4. Execute selected command
case $selected in
  0)
    read -r -p "Enter export directory [default: ~]: " export_dir < "$INPUT_DEV"
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
    echo "Exited."
    exit 0
    ;;
esac
