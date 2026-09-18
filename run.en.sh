#!/usr/bin/env bash

# ==============================================================================
# Typeless Export (tle) - Backward Compatibility Wrapper for run.en.sh
# Delegates to run.sh with TLE_LANG=en
# ==============================================================================

export TLE_LANG="en"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd || echo "")"

if [ -f "$SCRIPT_DIR/run.sh" ]; then
  exec bash "$SCRIPT_DIR/run.sh" "$@"
else
  MAIN_URL="https://raw.githubusercontent.com/QingYunA/typeless-export/main/run.sh"
  MIRROR_URL="https://cdn.jsdelivr.net/gh/QingYunA/typeless-export@main/run.sh"
  if ! curl -fsSL --connect-timeout 5 "$MAIN_URL" 2>/dev/null | bash -s -- "$@"; then
    curl -fsSL --connect-timeout 10 "$MIRROR_URL" | bash -s -- "$@"
  fi
fi
