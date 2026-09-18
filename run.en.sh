#!/usr/bin/env bash

# ==============================================================================
# Typeless Export (tle) - Backward Compatibility Wrapper for run.en.sh
# Delegates to run.sh with TLE_LANG=en
# ==============================================================================

export TLE_LANG="en"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd || echo "")"

if [ -f "$SCRIPT_DIR/run.sh" ] && [ -f "$SCRIPT_DIR/bin/cli.mjs" ]; then
  exec bash "$SCRIPT_DIR/run.sh" "$@"
else
  TMP_SCRIPT="$(mktemp -t typeless-run.XXXXXX)"
  trap 'rm -f "$TMP_SCRIPT"' EXIT INT TERM
  MAIN_URL="https://raw.githubusercontent.com/QingYunA/typeless-export/main/run.sh"
  MIRROR_URL="https://cdn.jsdelivr.net/gh/QingYunA/typeless-export@main/run.sh"

  if curl -fsSL --connect-timeout 5 "$MAIN_URL" -o "$TMP_SCRIPT" 2>/dev/null || \
     curl -fsSL --connect-timeout 10 "$MIRROR_URL" -o "$TMP_SCRIPT"; then
    exec bash "$TMP_SCRIPT" "$@"
  else
    echo "Error: Failed to download run.sh" >&2
    exit 1
  fi
fi
