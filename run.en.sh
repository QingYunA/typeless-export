#!/usr/bin/env bash

# ==============================================================================
# Typeless Export (tle) - Vocabulary Export & Migration Tool
# Supports curl -fsSL ... | bash with interactive arrow-key navigation
# ==============================================================================

set -e
export TLE_LANG=en

# 1. Determine execution directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd || echo "")"
CACHE_DIR="$HOME/.typeless-export"

if [ -f "$SCRIPT_DIR/bin/cli.mjs" ]; then
  PROJECT_ROOT="$SCRIPT_DIR"
else
  PROJECT_ROOT="$CACHE_DIR"
  if [ ! -f "$PROJECT_ROOT/bin/cli.mjs" ]; then
    echo "Downloading latest release..."
    mkdir -p "$PROJECT_ROOT"
    if ! curl -sSL --connect-timeout 5 "https://github.com/QingYunA/typeless-export/archive/refs/heads/main.tar.gz" | tar -xz -C "$PROJECT_ROOT" --strip-components=1 2>/dev/null; then
      echo "Direct download slow, trying mirror..."
      curl -sSL --connect-timeout 10 "https://ghproxy.net/https://github.com/QingYunA/typeless-export/archive/refs/heads/main.tar.gz" | tar -xz -C "$PROJECT_ROOT" --strip-components=1
    fi
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
  "Export Typeless vocabulary (save as txt, csv, json)"
  "Migrate to OpenLess (export & write to OpenLess dictionary)"
  "Sync 240+ programmer & AI hotwords to OpenLess"
  "Import custom wordlist file to OpenLess"
  "Install \`tle\` command to terminal PATH"
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
echo "=============================================="
echo "  Typeless Export - Vocabulary Migration Tool"
echo "=============================================="
echo "Use ↑ / ↓ keys to navigate, press Enter to confirm:"
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
  elif [[ $key == "4" ]]; then
    selected=3; print_menu "redraw"; break
  elif [[ $key == "5" ]]; then
    selected=4; print_menu "redraw"; break
  elif [[ $key == "6" || $key == "q" || $key == "Q" ]]; then
    selected=5; print_menu "redraw"; break
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
    "$JS_RUNNER" "$CLI_PATH" export
    ;;
  1)
    "$JS_RUNNER" "$CLI_PATH" migrate
    ;;
  2)
    "$JS_RUNNER" "$CLI_PATH" sync
    ;;
  3)
    read -r -p "Enter vocabulary file path: " input_file < "$INPUT_DEV"
    if [ -f "$input_file" ]; then
      read -r -p "Enter preset category name [default: Custom Vocabulary]: " input_preset < "$INPUT_DEV"
      input_preset="${input_preset:-Custom Vocabulary}"
      "$JS_RUNNER" "$CLI_PATH" import "$input_file" --preset "$input_preset"
    else
      echo "Error: File not found: $input_file"
      exit 1
    fi
    ;;
  4)
    INSTALL_BIN_DIR="/usr/local/bin"
    if [ ! -w "$INSTALL_BIN_DIR" ]; then
      INSTALL_BIN_DIR="$HOME/.local/bin"
      mkdir -p "$INSTALL_BIN_DIR"
    fi

    WRAPPER="$INSTALL_BIN_DIR/tle"
    cat << WRAPPER_EOF > "$WRAPPER"
#!/usr/bin/env bash
export TLE_LANG=en
exec bash "$PROJECT_ROOT/run.en.sh" "\$@"
WRAPPER_EOF
    chmod +x "$WRAPPER"

    echo "✓ Successfully installed tle to $WRAPPER"
    echo "You can now type \`tle\` in any terminal to open this menu!"
    ;;
  5)
    echo "Exited."
    exit 0
    ;;
esac
